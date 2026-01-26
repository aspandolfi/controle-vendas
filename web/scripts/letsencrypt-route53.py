#!/usr/bin/env python3
"""
Script para obter certificado Let's Encrypt usando validação DNS via Route53
Automação completa sem intervenção manual
"""

import boto3
import subprocess
import sys
import time
import argparse
from datetime import datetime

def get_route53_zone_id(domain):
    """Obtém o Zone ID do Route53 para o domínio"""
    client = boto3.client('route53')
    
    response = client.list_hosted_zones()
    for zone in response['HostedZones']:
        if domain in zone['Name']:
            return zone['Id'].split('/')[-1]
    
    raise Exception(f"Zona Route53 não encontrada para {domain}")

def create_txt_record(zone_id, record_name, record_value):
    """Cria record TXT no Route53 para validação"""
    client = boto3.client('route53')
    
    change_batch = {
        'Changes': [{
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': record_name,
                'Type': 'TXT',
                'TTL': 300,
                'ResourceRecords': [{'Value': f'"{record_value}"'}]
            }
        }]
    }
    
    response = client.change_resource_record_sets(
        HostedZoneId=zone_id,
        ChangeBatch=change_batch
    )
    
    return response['ChangeInfo']['Id']

def wait_for_dns_propagation(change_id):
    """Aguarda propagação do DNS"""
    client = boto3.client('route53')
    
    print("Aguardando propagação DNS...")
    while True:
        response = client.get_change(Id=change_id)
        status = response['ChangeInfo']['Status']
        
        if status == 'INSYNC':
            print("DNS propagado com sucesso!")
            break
        
        time.sleep(10)

def obtain_certificate(domain, email, environment, use_staging=False):
    """Obtém certificado usando certbot com plugin Route53"""
    cert_dir = f"./certificates/{environment}"
    
    cmd = [
        'certbot', 'certonly',
        '--dns-route53',
        '--email', email,
        '--agree-tos',
        '--no-eff-email',
        '--domain', domain,
        '--domain', f'www.{domain}',
        '--config-dir', f'{cert_dir}/config',
        '--work-dir', f'{cert_dir}/work',
        '--logs-dir', f'{cert_dir}/logs',
        '--non-interactive'
    ]
    
    if use_staging:
        cmd.append('--staging')
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Erro ao obter certificado: {result.stderr}")
        sys.exit(1)
    
    return f"{cert_dir}/config/live/{domain}"

def import_to_acm(cert_path, domain, environment, existing_arn=None):
    """Importa certificado para ACM"""
    client = boto3.client('acm', region_name='us-east-1')
    
    with open(f'{cert_path}/cert.pem', 'rb') as f:
        certificate = f.read()
    
    with open(f'{cert_path}/privkey.pem', 'rb') as f:
        private_key = f.read()
    
    with open(f'{cert_path}/chain.pem', 'rb') as f:
        certificate_chain = f.read()
    
    params = {
        'Certificate': certificate,
        'PrivateKey': private_key,
        'CertificateChain': certificate_chain,
        'Tags': [
            {'Key': 'Environment', 'Value': environment},
            {'Key': 'Domain', 'Value': domain},
            {'Key': 'ManagedBy', 'Value': 'LetsEncrypt'},
            {'Key': 'RenewedAt', 'Value': datetime.now().isoformat()}
        ]
    }
    
    if existing_arn:
        params['CertificateArn'] = existing_arn
        print(f"Atualizando certificado existente: {existing_arn}")
    
    response = client.import_certificate(**params)
    
    return response['CertificateArn']

def main():
    parser = argparse.ArgumentParser(description='Let\'s Encrypt certificate automation for AWS')
    parser.add_argument('--domain', required=True, help='Domain name (e.g., example.com)')
    parser.add_argument('--email', required=True, help='Email for Let\'s Encrypt notifications')
    parser.add_argument('--environment', default='dev', help='Environment (dev, staging, prod)')
    parser.add_argument('--staging', action='store_true', help='Use Let\'s Encrypt staging environment (for testing)')
    parser.add_argument('--renew', action='store_true', help='Renew existing certificate')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Let's Encrypt Certificate Automation")
    print("=" * 60)
    print(f"Domain: {args.domain}")
    print(f"Environment: {args.environment}")
    print(f"Staging: {args.staging}")
    print()
    
    # Verifica se certbot-dns-route53 está instalado
    try:
        subprocess.run(['certbot', '--version'], check=True, capture_output=True)
    except FileNotFoundError:
        print("Error: certbot não está instalado")
        print("Instale com: pip install certbot certbot-dns-route53")
        sys.exit(1)
    
    # Obtém certificado
    print("Step 1: Obtendo certificado do Let's Encrypt...")
    cert_path = obtain_certificate(
        args.domain,
        args.email,
        args.environment,
        args.staging
    )
    print(f"✓ Certificado obtido: {cert_path}")
    print()
    
    # Verifica se existe certificado anterior para renovação
    existing_arn = None
    cert_dir = f"./certificates/{args.environment}"
    arn_file = f"{cert_dir}/certificate-arn.txt"
    
    if args.renew:
        try:
            with open(arn_file, 'r') as f:
                existing_arn = f.read().strip()
            print(f"Renovando certificado: {existing_arn}")
        except FileNotFoundError:
            print("Nenhum certificado anterior encontrado, criando novo...")
    
    # Importa para ACM
    print("Step 2: Importando certificado para ACM (us-east-1)...")
    cert_arn = import_to_acm(cert_path, args.domain, args.environment, existing_arn)
    print(f"✓ Certificate ARN: {cert_arn}")
    print()
    
    # Salva ARN
    with open(arn_file, 'w') as f:
        f.write(cert_arn)
    
    with open(f"{cert_dir}/last-renewed.txt", 'w') as f:
        f.write(str(int(time.time())))
    
    print("=" * 60)
    print("✓ Certificado configurado com sucesso!")
    print("=" * 60)
    print()
    print("Configure no Terraform:")
    print(f'certificate_arn = "{cert_arn}"')
    print()
    print("IMPORTANTE:")
    print("- Certificados Let's Encrypt expiram em 90 dias")
    print("- Execute com --renew a cada 60 dias")
    print(f"- Comando: python3 {sys.argv[0]} --domain {args.domain} --email {args.email} --environment {args.environment} --renew")
    print()

if __name__ == '__main__':
    main()
