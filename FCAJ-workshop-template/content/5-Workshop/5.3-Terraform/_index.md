---
title: "5.3 Provisioning with Terraform"
date: 2026-07-10
weight: 3
chapter: false
---

## 5.3 Building Terraform IaC Scripts for Networks & Databases

Using the Terraform files below, you can programmatically deploy the entire network topology and relational database instance cleanly.

### 1. Declaring Provider requirements (`provider.tf`)
This tells Terraform to download the AWS resource controller binaries and choose the Singapore (`ap-southeast-1`) region:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### 2. Writing Primary Resource definitions (`main.tf`)
This block constructs the VPC networks, Subnet boundaries, Routing tables, and RDS instances:
```hcl
# 1. CREATE VIRTUAL PRIVATE NETWORK (VPC)
resource "aws_vpc" "smartdorm_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "smartdorm-vpc"
  }
}

# 2. PROVISION INTERNET GATEWAY ROUTING
resource "aws_internet_gateway" "smartdorm_igw" {
  vpc_id = aws_vpc.smartdorm_vpc.id
  tags = { Name = "smartdorm-igw" }
}

# 3. CONFIGURING PUBLIC & PRIVATE NETWORKS
# Subnet A (Public) - Holds Lambda computing endpoints
resource "aws_subnet" "smartdorm_subnet_a" {
  vpc_id                  = aws_vpc.smartdorm_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "ap-southeast-1a"
  map_public_ip_on_launch = true
  tags = { Name = "smartdorm-subnet-a" }
}

# Subnet B (Private) - Protects Database tables
resource "aws_subnet" "smartdorm_subnet_b" {
  vpc_id                  = aws_vpc.smartdorm_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "ap-southeast-1b"
  map_public_ip_on_launch = true
  tags = { Name = "smartdorm-subnet-b" }
}

# 4. ASSOCIATE ROUTING
resource "aws_route_table" "smartdorm_rt" {
  vpc_id = aws_vpc.smartdorm_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.smartdorm_igw.id
  }
}

resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.smartdorm_subnet_a.id
  route_table_id = aws_route_table.smartdorm_rt.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.smartdorm_subnet_b.id
  route_table_id = aws_route_table.smartdorm_rt.id
}

# 5. CONFIGURE DATABASE SECURITY BOUNDARIES
resource "aws_security_group" "rds_sg" {
  name        = "smartdorm_rds_sg"
  description = "Permit PostgreSQL incoming traffic"
  vpc_id      = aws_vpc.smartdorm_vpc.id

  # Open port 5432 publicly for easier database seeding and direct access during lab demonstration
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 6. INSTANTIATING Managed RDS PostgreSQL
resource "aws_db_subnet_group" "smartdorm_db_subnet_group" {
  name       = "smartdorm-db-subnet-group"
  subnet_ids = [aws_subnet.smartdorm_subnet_a.id, aws_subnet.smartdorm_subnet_b.id]
}

resource "aws_db_instance" "smartdorm_db" {
  identifier             = "smartdorm-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro" # Graviton2 ARM - eligible for Free Tier
  db_name                = "smartdorm"
  username               = "postgres"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.smartdorm_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  publicly_accessible    = true
  skip_final_snapshot    = true
}
```

### 3. Variable declarations (`variables.tf`)
Safeguards confidential items:
```hcl
variable "aws_region" {
  type    = string
  default = "ap-southeast-1"
}

variable "db_password" {
  type      = string
  sensitive = true
}
```
