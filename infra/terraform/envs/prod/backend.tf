terraform {
  backend "s3" {
    bucket         = "advancia-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "advancia-terraform-locks"
  }
}
