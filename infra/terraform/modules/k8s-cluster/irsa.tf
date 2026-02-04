# Optional OIDC provider and IRSA role for service accounts
resource "aws_iam_openid_connect_provider" "oidc" {
  count = var.enable_irsa ? 1 : 0
  url   = replace(aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [var.oidc_thumbprint]
}

resource "aws_iam_role" "irsa_role" {
  count = var.enable_irsa ? 1 : 0
  name  = "${var.name}-irsa-role"
  assume_role_policy = data.aws_iam_policy_document.irsa_assume.json
}

data "aws_iam_policy_document" "irsa_assume" {
  count = var.enable_irsa ? 1 : 0
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.oidc[0].arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_eks_cluster.this.identity[0].oidc[0].issuer, "https://", "")}:sub"
      values   = ["system:serviceaccount:platform-core:external-secrets-sa"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "irsa_policy_attach" {
  count      = var.enable_irsa ? 1 : 0
  role       = aws_iam_role.irsa_role[0].name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite"
}
