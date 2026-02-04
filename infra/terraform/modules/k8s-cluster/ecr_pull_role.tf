# Role for pods to pull from ECR (if using IRSA)
resource "aws_iam_role" "ecr_pull_role" {
  name = "${var.name}-ecr-pull-role"
  assume_role_policy = data.aws_iam_policy_document.ecr_assume.json
}

data "aws_iam_policy_document" "ecr_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "ecr_pull_policy" {
  name = "${var.name}-ecr-pull-policy"
  role = aws_iam_role.ecr_pull_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}
