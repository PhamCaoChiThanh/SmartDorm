---
title: "5.7 Cleanup Resources"
date: 2026-07-10
weight: 7
chapter: false
---

## 5.7 Cleanup AWS Resources

Teardown active cloud resources to prevent ongoing billing when the lab/testing session ends.

### Hủy hạ tầng bằng câu lệnh Terraform CLI
Open terminals in your Terraform workspace folder and run:
```bash
terraform destroy -var="db_password=Chithanh123plus" -auto-approve
```

#### Destruction Steps:
1.  Removes Route Tables and Network Gateways.
2.  Drops RDS PostgreSQL database engine blocks (takes ~3-5 mins).
3.  Deletes the AWS Lambda API execution codes, S3 buckets, and API Gateway configurations.
4.  Returns confirmation log:
    ```text
    Destroy complete! Resources: 18 destroyed.
    ```

> [!WARNING]
> Executing `terraform destroy` permanently deletes the PostgreSQL tables. Backup database configurations before running.
