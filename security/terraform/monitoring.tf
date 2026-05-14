resource "aws_cloudwatch_log_group" "vehicles_logs" {
  name              = "/aws/lambda/${aws_lambda_function.vehicles_module.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors lambda errors"
  
  dimensions = {
    FunctionName = aws_lambda_function.vehicles_module.function_name
  }
}
