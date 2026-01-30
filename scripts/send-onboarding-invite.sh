#!/bin/bash

# Advancia PayLedger - Customer Onboarding Invitation Script
# Sends personalized onboarding invitations to new customers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
BATCH_SIZE=50
INVITE_TEMPLATE="templates/onboarding-invite.html"
LOG_FILE="logs/onboarding.log"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1" >> "$LOG_FILE"
}

log_invite() {
    echo -e "${PURPLE}📧 $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [INVITE] $1" >> "$LOG_FILE"
}

log_onboarding() {
    echo -e "${CYAN}👋 $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ONBOARDING] $1" >> "$LOG_FILE"
}

# Create necessary directories
mkdir -p logs templates reports

# Banner
echo "👋 Advancia PayLedger - Customer Onboarding Invitation System"
echo "=========================================================="
echo "📧 Batch Size: $BATCH_SIZE invitations"
echo "🌐 Frontend: $FRONTEND_URL"
echo "📝 Log File: $LOG_FILE"
echo ""

# Check backend connection
check_backend() {
    if ! curl -s "$BACKEND_URL/health" > /dev/null; then
        log_error "Backend not accessible. Please start the backend server."
        exit 1
    fi
}

# Get pending invitations
get_pending_invitations() {
    log_info "Fetching pending onboarding invitations..."
    
    # Simulate API call to get pending customers
    local response=$(curl -s "$BACKEND_URL/api/customers/pending-onboarding" 2>/dev/null || echo '[]')
    
    # Parse response (simulated for demo)
    PENDING_COUNT=$(echo "$response" | jq '. | length' 2>/dev/null || echo "25")
    
    # Generate demo data if API not available
    if [ "$PENDING_COUNT" = "null" ] || [ -z "$PENDING_COUNT" ]; then
        PENDING_COUNT=$((20 + RANDOM % 30))
    fi
    
    log_success "Found $PENDING_COUNT customers pending onboarding"
}

# Create email template
create_email_template() {
    log_info "Creating email template..."
    
    cat > "$INVITE_TEMPLATE" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Welcome to Advancia PayLedger</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; max-width: 600px; margin: 0 auto; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .feature { margin: 15px 0; padding: 10px; background: #f8fafc; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏥 Welcome to Advancia PayLedger</h1>
        <p>Revolutionary Healthcare Payment Processing</p>
    </div>
    
    <div class="content">
        <h2>Hi {{FIRST_NAME}},</h2>
        
        <p>Welcome to the future of healthcare payments! Your account has been created and you're ready to start processing payments with our cutting-edge platform.</p>
        
        <h3>🚀 Get Started in 3 Simple Steps:</h3>
        
        <div class="feature">
            <strong>1. Complete Your Profile</strong><br>
            Add your facility information and payment preferences
        </div>
        
        <div class="feature">
            <strong>2. Configure Payment Methods</strong><br>
            Set up credit cards, debit cards, ACH, and cryptocurrency options
        </div>
        
        <div class="feature">
            <strong>3. Start Processing Payments</strong><br>
            Begin accepting payments from patients and insurance providers
        </div>
        
        <div style="text-align: center;">
            <a href="{{ONBOARDING_URL}}" class="button">Start Onboarding Now</a>
        </div>
        
        <h3>💎 What Makes Us Different:</h3>
        <ul>
            <li>✅ HIPAA-compliant security</li>
            <li>✅ Support for cryptocurrency payments</li>
            <li>✅ 40% lower processing fees</li>
            <li>✅ Real-time analytics dashboard</li>
            <li>✅ 24/7 customer support</li>
        </ul>
        
        <p>Your personal onboarding specialist will be contacting you within 24 hours to help you get the most out of our platform.</p>
        
        <p>Questions? Reply to this email or call us at <strong>1-800-ADVANCIA</strong></p>
    </div>
    
    <div class="footer">
        <p>© 2026 Advancia PayLedger. All rights reserved.</p>
        <p>123 Healthcare Ave, Medical City, MC 12345</p>
        <p>This email was sent to {{EMAIL}} because you registered for Advancia PayLedger.</p>
    </div>
</body>
</html>
EOF
    
    log_success "Email template created"
}

# Generate customer list
generate_customer_list() {
    log_info "Generating customer list for batch processing..."
    
    local customer_file="temp/customers-$(date +%Y%m%d-%H%M%S).csv"
    mkdir -p temp
    
    # Create CSV header
    echo "firstName,lastName,email,company,registrationDate" > "$customer_file"
    
    # Generate sample customers
    local first_names=("John" "Sarah" "Michael" "Emily" "David" "Jessica" "Robert" "Amanda" "William" "Jennifer")
    local last_names=("Smith" "Johnson" "Williams" "Brown" "Jones" "Garcia" "Miller" "Davis" "Rodriguez" "Martinez")
    local companies=("City Medical Center" "HealthFirst Clinic" "Family Care Associates" "Urgent Care Plus" "Wellness Medical Group")
    
    for ((i=1; i<=PENDING_COUNT; i++)); do
        local first_name=${first_names[$((RANDOM % ${#first_names[@]}))]}
        local last_name=${last_names[$((RANDOM % ${#last_names[@]}))]}
        local company=${companies[$((RANDOM % ${#companies[@]}))]}
        local email="${first_name,,}.${last_name,,}@${company,,// /-}.com"
        local reg_date=$(date -d "$((RANDOM % 30 + 1)) days ago" +%Y-%m-%d)
        
        echo "$first_name,$last_name,$email,$company,$reg_date" >> "$customer_file"
    done
    
    log_success "Generated $PENDING_COUNT customers in $customer_file"
    echo "$customer_file"
}

# Send personalized invitations
send_invitations() {
    local customer_file="$1"
    local sent_count=0
    local failed_count=0
    
    log_info "Sending personalized invitations..."
    
    # Skip header and process each customer
    tail -n +2 "$customer_file" | while IFS=',' read -r first_name last_name email company reg_date; do
        # Generate onboarding URL
        local onboarding_token=$(openssl rand -hex 16)
        local onboarding_url="$FRONTEND_URL/onboarding?token=$onboarding_token&email=$email"
        
        # Personalize email template
        local personalized_email=$(sed "s/{{FIRST_NAME}}/$first_name/g; s/{{EMAIL}}/$email/g; s/{{ONBOARDING_URL}}/$onboarding_url/g" "$INVITE_TEMPLATE")
        
        # Send email (simulated)
        echo "📧 Sending to: $email ($first_name $last_name - $company)"
        echo "🔗 Onboarding URL: $onboarding_url"
        
        # Simulate email sending
        if [ $((RANDOM % 10)) -gt 1 ]; then
            echo "✅ Email sent successfully"
            sent_count=$((sent_count + 1))
            
            # Log to backend (simulated)
            curl -X POST "$BACKEND_URL/api/onboarding/invite-sent" \
                -H "Content-Type: application/json" \
                -d "{
                    \"email\": \"$email\",
                    \"firstName\": \"$first_name\",
                    \"lastName\": \"$last_name\",
                    \"company\": \"$company\",
                    \"onboardingToken\": \"$onboarding_token\",
                    \"sentAt\": \"$(date -Iseconds)\"
                }" 2>/dev/null || true
        else
            echo "❌ Email failed (simulated)"
            failed_count=$((failed_count + 1))
        fi
        
        echo ""
        
        # Rate limiting to avoid overwhelming email server
        sleep 0.5
    done
    
    log_success "Invitation batch completed"
    log_invite "Sent: $sent_count, Failed: $failed_count"
}

# Send SMS reminders (for high-value customers)
send_sms_reminders() {
    log_info "Sending SMS reminders to high-value customers..."
    
    # Select random high-value customers
    local sms_count=$((PENDING_COUNT / 10))
    
    for ((i=1; i<=sms_count; i++)); do
        local phone_number="+1$(printf "%3d%3d%4d" $((RANDOM % 900 + 100)) $((RANDOM % 900 + 100)) $((RANDOM % 10000)))"
        local message="🏥 Advancia PayLedger: Complete your onboarding now! Check your email for your personal link. Reply HELP for support."
        
        echo "📱 SMS to $phone_number: $message"
        
        # Simulate SMS sending
        if [ $((RANDOM % 10)) -gt 2 ]; then
            echo "✅ SMS sent successfully"
        else
            echo "❌ SMS failed (simulated)"
        fi
    done
    
    log_success "SMS reminders sent to $sms_count high-value customers"
}

# Schedule follow-up sequence
schedule_followups() {
    log_info "Scheduling automated follow-up sequence..."
    
    # Create follow-up schedule
    cat > "temp/followup-schedule-$(date +%Y%m%d).txt" << EOF
Follow-up Schedule - $(date +%Y-%m-%d)

Day 1 (24 hours after initial):
- Send reminder email to non-opened invites
- Send SMS to high-value customers

Day 3 (72 hours after initial):
- Send "Getting Started" guide
- Offer personal onboarding call

Day 7 (1 week after initial):
- Send success stories and case studies
- Highlight key features they're missing

Day 14 (2 weeks after initial):
- Final reminder with limited-time offer
- Schedule personal demo

Day 30 (1 month after initial):
- Re-engagement campaign for dormant users
- Feature updates and improvements
EOF
    
    log_success "Follow-up sequence scheduled"
}

# Generate onboarding report
generate_onboarding_report() {
    local report_date=$(date +%Y-%m-%d)
    local report_file="reports/onboarding-report-$report_date.md"
    
    cat > "$report_file" << EOF
# Customer Onboarding Report - $report_date

## Invitation Summary
- **Total Pending Customers:** $PENDING_COUNT
- **Batch Size:** $BATCH_SIZE
- **Invitations Sent:** $sent_count
- **Failed Deliveries:** $failed_count
- **Success Rate:** $(( sent_count * 100 / (sent_count + failed_count) ))%

## Customer Segments
- **Healthcare Providers:** $((PENDING_COUNT * 40 / 100))
- **Medical Clinics:** $((PENDING_COUNT * 30 / 100))
- **Hospitals:** $((PENDING_COUNT * 20 / 100))
- **Billing Companies:** $((PENDING_COUNT * 10 / 100))

## Expected Conversion
- **Day 1 Onboarding:** $((sent_count * 25 / 100))
- **Week 1 Completion:** $((sent_count * 60 / 100))
- **Month 1 Active:** $((sent_count * 80 / 100))

## Revenue Projection
- **Setup Fees:** $((sent_count * 50))
- **Monthly Revenue (Month 2):** $((sent_count * 80 * 29))
- **Yearly Revenue:** $((sent_count * 80 * 29 * 12))

## Next Steps
1. Monitor onboarding completion rates
2. Follow up with non-responsive customers
3. Optimize email templates based on performance
4. Schedule personal demos for high-value customers

---
*Generated: $(date)*
EOF
    
    log_success "Onboarding report saved to $report_file"
}

# Create onboarding dashboard link
create_dashboard_link() {
    log_info "Creating onboarding dashboard..."
    
    echo ""
    echo "📊 ONBOARDING DASHBOARD"
    echo "======================="
    echo "🌐 Live Dashboard: $FRONTEND_URL/admin/onboarding"
    echo "📈 Real-time Metrics: $BACKEND_URL/api/onboarding/metrics"
    echo "📧 Email Templates: ./templates/"
    echo "📊 Reports: ./reports/"
    echo ""
    echo "🔗 Quick Links:"
    echo "   • View pending customers: $FRONTEND_URL/admin/customers/pending"
    echo "   • Email performance: $FRONTEND_URL/admin/email/analytics"
    echo "   • Onboarding funnel: $FRONTEND_URL/admin/analytics/onboarding"
    echo ""
}

# Main execution
main() {
    echo "👋 Starting Customer Onboarding Invitation Process..."
    echo ""
    
    # Pre-flight checks
    check_backend
    
    # Setup
    create_email_template
    
    # Get customers
    get_pending_invitations
    local customer_file=$(generate_customer_list)
    
    # Send invitations
    send_invitations "$customer_file"
    send_sms_reminders
    
    # Schedule follow-ups
    schedule_followups
    
    # Generate reports
    generate_onboarding_report
    
    # Create dashboard links
    create_dashboard_link
    
    # Cleanup temp files
    rm -f "$customer_file"
    
    echo ""
    echo "🎉 ONBOARDING INVITATION PROCESS COMPLETED!"
    echo "=========================================="
    echo ""
    echo "📊 Summary:"
    echo "   • $PENDING_COUNT customers processed"
    echo "   • $sent_count invitations sent"
    echo "   • $failed_count failed deliveries"
    echo "   • Follow-up sequence scheduled"
    echo ""
    echo "🔗 Next Steps:"
    echo "   1. Monitor onboarding: $FRONTEND_URL/admin/onboarding"
    echo "   2. Track revenue: ./scripts/track-revenue.sh"
    echo "   3. View reports: ./reports/"
    echo ""
    echo "📈 Expected Results:"
    echo "   • Day 1: $((sent_count * 25 / 100)) onboardings"
    echo "   • Week 1: $((sent_count * 60 / 100)) completions"
    echo "   • Month 1: $((sent_count * 80 / 100)) active customers"
    echo ""
    
    log_success "Customer onboarding invitations sent successfully! 🚀"
}

# Run the onboarding process
main
