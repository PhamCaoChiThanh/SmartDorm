---
title: "5.6 Cleanup AWS Resources"
date: 2026-07-10
weight: 6
chapter: false
---

## 5.6 Cleanup AWS Resources to Prevent Costs

To ensure you are not billed for idle resources on AWS after demonstrating your lab, execute a complete teardown.

### Terminate Infrastructure via Terraform CLI
Navigate to your `terraform/` directory and execute:
```bash
terraform destroy -var="db_password=Chithanh123plus" -auto-approve
```

#### Expected Output:
*   CLI lists all resources targeted for deletion (VPC network nodes, RDS instances, Lambda functions, HTTP routes).
*   Returns success message:
    ```text
    Destroy complete! Resources: 18 destroyed.
    ```

> [!WARNING]
> Running `terraform destroy` drops all PostgreSQL tables permanently on AWS. Back up important records before starting.
