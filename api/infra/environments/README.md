# Terraform Multi-Environment Configuration

This directory contains environment-specific configurations for deploying the infrastructure.

## 📁 Structure

```
infra/
├── backends/              # Backend configurations (S3 + DynamoDB)
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── environments/          # Environment-specific variables
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── prod.tfvars
├── main.tf               # Provider and backend
├── variables.tf          # Variable definitions
├── outputs.tf            # Output definitions
├── dynamodb.tf           # DynamoDB resources
├── iam.tf                # IAM roles and policies
├── lambda.tf             # Lambda function
└── api_gateway.tf        # API Gateway
```

## 🌍 Environments

### Development (dev)
- **Purpose**: Local development and testing
- **Lambda Memory**: 512MB
- **Log Retention**: 7 days
- **CORS**: localhost:4200, localhost:3000
- **Features**: Fast iteration, debug enabled

### Staging (staging)
- **Purpose**: Pre-production testing
- **Lambda Memory**: 1024MB
- **Log Retention**: 14 days
- **CORS**: staging.yourdomain.com
- **Features**: Production-like, safe testing

### Production (prod)
- **Purpose**: Live production environment
- **Lambda Memory**: 2048MB
- **Log Retention**: 30 days
- **CORS**: app.yourdomain.com
- **Features**: High availability, backups enabled

## 🚀 Quick Start

### Using the Helper Script (Recommended)

```bash
# Linux/Mac
cd api/scripts
./terraform.sh <environment> <action>

# Windows
cd api\scripts
terraform.bat <environment> <action>
```

**Examples:**
```bash
# Initialize dev environment
./terraform.sh dev init

# Plan changes for staging
./terraform.sh staging plan

# Apply to production
./terraform.sh prod apply

# Show outputs
./terraform.sh dev output

# Destroy staging
./terraform.sh staging destroy
```

### Manual Commands

```bash
cd api/infra

# Initialize for specific environment
terraform init -backend-config=backends/dev.tfvars

# Plan with environment variables
terraform plan -var-file=environments/dev.tfvars

# Apply with environment variables
terraform apply -var-file=environments/dev.tfvars

# Destroy environment
terraform destroy -var-file=environments/dev.tfvars
```

## 📝 Configuration Files

### Backend Configuration (backends/*.tfvars)

Controls where Terraform state is stored:
- `bucket`: S3 bucket name for state
- `key`: Path within bucket (unique per environment)
- `region`: AWS region
- `encrypt`: Enable encryption
- `dynamodb_table`: Table for state locking

**Important**: State files are stored separately for each environment to prevent conflicts.

### Environment Variables (environments/*.tfvars)

Controls infrastructure settings:
- `environment`: Environment name
- `lambda_memory_size`: Lambda RAM allocation
- `log_retention_days`: CloudWatch log retention
- `cors_allowed_origins`: Allowed CORS origins
- `enable_xray_tracing`: Enable/disable X-Ray

## 🔧 Customization

### Adding a New Environment

1. Create backend config:
```bash
cp backends/dev.tfvars backends/newenv.tfvars
# Edit backends/newenv.tfvars
```

2. Create environment config:
```bash
cp environments/dev.tfvars environments/newenv.tfvars
# Edit environments/newenv.tfvars
```

3. Deploy:
```bash
./terraform.sh newenv init
./terraform.sh newenv plan
./terraform.sh newenv apply
```

### Modifying Environment Settings

Edit the appropriate file in `environments/`:
```bash
# Edit development settings
nano environments/dev.tfvars

# Apply changes
./terraform.sh dev plan
./terraform.sh dev apply
```

### Common Modifications

**Increase Lambda memory:**
```hcl
# environments/prod.tfvars
lambda_memory_size = 3008  # Max: 10240MB
```

**Add CORS origin:**
```hcl
# environments/staging.tfvars
cors_allowed_origins = [
  "https://staging.yourdomain.com",
  "https://test.yourdomain.com"
]
```

**Change log retention:**
```hcl
# environments/prod.tfvars
log_retention_days = 90  # Keep logs longer in prod
```

## 🔒 Best Practices

### State Management
- ✅ Use separate state files per environment
- ✅ Enable state locking with DynamoDB
- ✅ Enable state file encryption
- ✅ Regular state backups

### Deployment Workflow
1. **Dev**: Test changes rapidly
2. **Staging**: Validate with production-like setup
3. **Prod**: Deploy after thorough testing

### Safety Measures
- Always run `plan` before `apply`
- Review plan output carefully
- Use `terraform.sh` script for safety checks
- Require confirmation for `destroy`

## 📊 Comparison Matrix

| Feature | Dev | Staging | Prod |
|---------|-----|---------|------|
| Lambda Memory | 512MB | 1024MB | 2048MB |
| Log Retention | 7 days | 14 days | 30 days |
| X-Ray Tracing | ✅ | ✅ | ✅ |
| PITR (DynamoDB) | ❌ | ❌ | ✅ |
| Cost (est./month) | $5-10 | $20-30 | $50-100 |

## 🔍 Troubleshooting

### State Lock Issues
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Backend Reinitialization
```bash
# If backend config changes
./terraform.sh dev init
```

### Check Current State
```bash
# List all resources
./terraform.sh dev state

# Show specific resource
terraform state show aws_lambda_function.api
```

### Import Existing Resources
```bash
# Import manually created resource
terraform import -var-file=environments/dev.tfvars \
  aws_dynamodb_table.main controle-vendas-dev
```

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Terraform Deploy
  run: |
    cd api/scripts
    ./terraform.sh ${{ matrix.environment }} init
    ./terraform.sh ${{ matrix.environment }} plan
    ./terraform.sh ${{ matrix.environment }} apply
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

### Environment Promotion

```bash
# Deploy to dev
./terraform.sh dev apply

# Test in dev...

# Promote to staging
./terraform.sh staging apply

# Test in staging...

# Promote to prod
./terraform.sh prod apply
```

## 📚 Additional Resources

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Backend Configuration](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [Variable Files](https://developer.hashicorp.com/terraform/language/values/variables)
