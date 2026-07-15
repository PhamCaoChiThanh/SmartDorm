---
title: "5.2 Prerequisites"
date: 2026-07-10
weight: 2
chapter: false
---

## 5.2 Prerequisites

Before starting the laboratory steps, ensure you have configured the following tools on your local system:

### 1. AWS Account
*   Sign up for an active AWS account at [https://aws.amazon.com/](https://aws.amazon.com/) to utilize the 12-month Free Tier benefits.

### 2. Command Line Tools
*   **AWS CLI v2:** For authenticating with your cloud environment.
    *   Download link: [AWS CLI Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
    *   Configure credentials by running `aws configure` in your terminal.
*   **Terraform CLI (>= 1.5.0):** To execute infrastructure automation scripts.
    *   Download link: [Terraform Install Page](https://developer.hashicorp.com/terraform/downloads)

### 3. Application Runtimes
*   **C# .NET 10/8 SDK:** To compile and package backend zip archives.
*   **NodeJS (>= 18.0.0):** For compiling Next.js static files.
*   **Docker Desktop:** To run a mock PostgreSQL database locally.
