#!/usr/bin/env python3
import requests
import json
import uuid
import datetime
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend/.env
BACKEND_URL = "https://11a27c10-faa2-4e83-aba0-2dee99e48bcb.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"

# Test user ID
TEST_USER_ID = "test-user-123"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(message):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'=' * 80}{Colors.ENDC}\n")

def print_success(message):
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"{Colors.WARNING}! {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.OKBLUE}ℹ {message}{Colors.ENDC}")

def get_security_headers() -> Dict[str, str]:
    """Generate security headers for API requests"""
    return {
        'X-User-Token': f"mock_token_{uuid.uuid4()}",
        'X-Session-ID': f"session_{uuid.uuid4()}",
        'X-Request-ID': str(uuid.uuid4()),
        'X-Timestamp': datetime.datetime.utcnow().isoformat(),
        'Content-Type': 'application/json'
    }

def make_request(method, endpoint, data=None, params=None):
    """Make a request to the API with security headers"""
    url = f"{API_BASE_URL}{endpoint}"
    headers = get_security_headers()
    
    print_info(f"Making {method} request to {url}")
    print_info(f"Headers: {json.dumps(headers, indent=2)}")
    
    if data:
        print_info(f"Request data: {json.dumps(data, indent=2)}")
    
    try:
        if method.lower() == 'get':
            response = requests.get(url, headers=headers, params=params)
        elif method.lower() == 'post':
            response = requests.post(url, headers=headers, json=data)
        else:
            print_error(f"Unsupported method: {method}")
            return None
        
        print_info(f"Response status code: {response.status_code}")
        
        if response.status_code >= 200 and response.status_code < 300:
            try:
                response_json = response.json()
                print_info(f"Response data: {json.dumps(response_json, indent=2)}")
                return response_json
            except json.JSONDecodeError:
                print_warning("Response is not JSON")
                print_info(f"Response text: {response.text}")
                return response.text
        else:
            print_error(f"Request failed with status code {response.status_code}")
            print_info(f"Response text: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Request exception: {str(e)}")
        return None

def test_health_check():
    """Test the health check endpoint"""
    print_header("Testing Health Check Endpoint")
    response = make_request('get', '/health')
    
    if response and 'status' in response and response['status'] == 'healthy':
        print_success("Health check endpoint is working")
        return True
    else:
        print_error("Health check endpoint is not working")
        return False

def test_user_dashboard():
    """Test the user dashboard endpoint"""
    print_header("Testing User Dashboard Endpoint")
    response = make_request('get', f'/user-dashboard/{TEST_USER_ID}')
    
    if response and 'user_id' in response and response['user_id'] == TEST_USER_ID:
        print_success("User dashboard endpoint is working")
        return True
    else:
        print_error("User dashboard endpoint is not working")
        return False

def test_user_goals():
    """Test the user goals endpoint"""
    print_header("Testing User Goals Endpoint")
    response = make_request('get', f'/user-goals/{TEST_USER_ID}')
    
    if response and 'goals' in response and isinstance(response['goals'], list):
        print_success("User goals endpoint is working")
        return True
    else:
        print_error("User goals endpoint is not working")
        return False

def test_performance_metrics():
    """Test the performance metrics endpoint"""
    print_header("Testing Performance Metrics Endpoint")
    response = make_request('get', f'/performance-metrics/{TEST_USER_ID}')
    
    if response and 'user_id' in response and response['user_id'] == TEST_USER_ID:
        print_success("Performance metrics endpoint is working")
        return True
    else:
        print_error("Performance metrics endpoint is not working")
        return False

def test_goal_update():
    """Test the goal update endpoint"""
    print_header("Testing Goal Update Endpoint")
    
    goal_data = {
        "user_id": TEST_USER_ID,
        "title": "Test Goal",
        "description": "This is a test goal",
        "progress": 50.0,
        "status": "active"
    }
    
    response = make_request('post', '/goal-update', data=goal_data)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Goal update endpoint is working")
        return True
    else:
        print_error("Goal update endpoint is not working")
        return False

def test_conversation_history():
    """Test the conversation history endpoint"""
    print_header("Testing Conversation History Endpoint")
    
    # Test with various query parameters
    params = {
        "limit": 3,
        "category": "fitness",
        "search": "deadlift"
    }
    
    response = make_request('get', f'/conversation-history/{TEST_USER_ID}', params=params)
    
    if response and 'conversations' in response and isinstance(response['conversations'], list):
        print_success("Conversation history endpoint is working")
        return True
    else:
        print_error("Conversation history endpoint is not working")
        return False

def test_intervention_queue():
    """Test the intervention queue endpoint"""
    print_header("Testing Intervention Queue Endpoint")
    response = make_request('get', f'/intervention-queue/{TEST_USER_ID}')
    
    if response and 'interventions' in response and isinstance(response['interventions'], list):
        print_success("Intervention queue endpoint is working")
        return True
    else:
        print_error("Intervention queue endpoint is not working")
        return False

def test_weekly_report():
    """Test the weekly report endpoint"""
    print_header("Testing Weekly Report Endpoint")
    response = make_request('get', f'/weekly-report/{TEST_USER_ID}')
    
    if response and 'report' in response and isinstance(response['report'], dict):
        print_success("Weekly report endpoint is working")
        return True
    else:
        print_error("Weekly report endpoint is not working")
        return False

def test_send_notification():
    """Test the send notification endpoint"""
    print_header("Testing Send Notification Endpoint")
    
    notification_data = {
        "user_id": TEST_USER_ID,
        "title": "Test Notification",
        "message": "This is a test notification",
        "type": "reminder",
        "priority": "high"
    }
    
    response = make_request('post', '/send-notification', data=notification_data)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Send notification endpoint is working")
        return True
    else:
        print_error("Send notification endpoint is not working")
        return False

def test_pattern_detected():
    """Test the pattern detected endpoint"""
    print_header("Testing Pattern Detected Endpoint")
    
    pattern_data = {
        "user_id": TEST_USER_ID,
        "pattern_type": "missed_workout",
        "pattern_data": {
            "days_missed": 3,
            "last_workout": "2024-06-01"
        },
        "confidence": 0.85
    }
    
    response = make_request('post', '/pattern-detected', data=pattern_data)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Pattern detected endpoint is working")
        return True
    else:
        print_error("Pattern detected endpoint is not working")
        return False

def run_all_tests():
    """Run all API tests"""
    print_header("RUNNING ALL API TESTS")
    
    results = {
        "health_check": test_health_check(),
        "user_dashboard": test_user_dashboard(),
        "user_goals": test_user_goals(),
        "performance_metrics": test_performance_metrics(),
        "goal_update": test_goal_update(),
        "conversation_history": test_conversation_history(),
        "intervention_queue": test_intervention_queue(),
        "weekly_report": test_weekly_report(),
        "send_notification": test_send_notification(),
        "pattern_detected": test_pattern_detected()
    }
    
    print_header("TEST RESULTS SUMMARY")
    
    all_passed = True
    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")
            all_passed = False
    
    if all_passed:
        print_header("ALL TESTS PASSED! 🎉")
        return 0
    else:
        print_header("SOME TESTS FAILED! 😢")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
