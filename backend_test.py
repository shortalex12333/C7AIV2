#!/usr/bin/env python3
import requests
import json
import uuid
import datetime
import sys
from typing import Dict, Any, Optional

# Backend URL from frontend/.env
BACKEND_URL = "https://63a0c2a2-fd8a-4676-9c94-c642e7b65503.preview.emergentagent.com"
API_BASE_URL = f"{BACKEND_URL}/api"

# Test user credentials
TEST_USER_EMAIL = "test_user@example.com"
TEST_USER_PASSWORD = "Test@123456"
TEST_USER_FIRST_NAME = "Test"
TEST_USER_LAST_NAME = "User"

# Global variables to store auth token and user ID
access_token = None
user_id = None
test_goal_id = None

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

def get_headers(with_auth=False) -> Dict[str, str]:
    """Generate headers for API requests"""
    headers = {
        'Content-Type': 'application/json'
    }
    
    if with_auth and access_token:
        headers['Authorization'] = f"Bearer {access_token}"
    
    return headers

def make_request(method, endpoint, data=None, params=None, with_auth=False):
    """Make a request to the API"""
    url = f"{API_BASE_URL}{endpoint}"
    headers = get_headers(with_auth)
    
    print_info(f"Making {method} request to {url}")
    
    if data:
        print_info(f"Request data: {json.dumps(data, indent=2)}")
    
    try:
        if method.lower() == 'get':
            response = requests.get(url, headers=headers, params=params)
        elif method.lower() == 'post':
            response = requests.post(url, headers=headers, json=data)
        elif method.lower() == 'put':
            response = requests.put(url, headers=headers, json=data)
        elif method.lower() == 'delete':
            response = requests.delete(url, headers=headers, params=params)
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
    
    if response and 'status' in response and response['status'] == 'ok':
        print_success("Health check endpoint is working")
        return True
    else:
        print_error("Health check endpoint is not working")
        return False

def test_signup():
    """Test the signup endpoint"""
    print_header("Testing Signup Endpoint")
    
    # Generate a unique email to avoid conflicts
    unique_email = f"test_user_{uuid.uuid4().hex[:8]}@example.com"
    
    signup_data = {
        "email": unique_email,
        "password": TEST_USER_PASSWORD,
        "firstName": TEST_USER_FIRST_NAME,
        "lastName": TEST_USER_LAST_NAME
    }
    
    response = make_request('post', '/auth/signup', data=signup_data)
    
    if response and 'access_token' in response and 'user_id' in response:
        print_success("Signup endpoint is working")
        
        # Store the access token and user ID for subsequent tests
        global access_token, user_id
        access_token = response['access_token']
        user_id = response['user_id']
        
        print_info(f"Access token: {access_token}")
        print_info(f"User ID: {user_id}")
        
        return True
    else:
        print_error("Signup endpoint is not working")
        return False

def test_signin():
    """Test the signin endpoint"""
    print_header("Testing Signin Endpoint")
    
    # If we already have a token from signup, skip this test
    global access_token, user_id
    if access_token and user_id:
        print_warning("Already signed in from signup test, using existing token")
        return True
    
    signin_data = {
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    }
    
    response = make_request('post', '/auth/signin', data=signin_data)
    
    if response and 'access_token' in response and 'user_id' in response:
        print_success("Signin endpoint is working")
        
        # Store the access token and user ID for subsequent tests
        access_token = response['access_token']
        user_id = response['user_id']
        
        print_info(f"Access token: {access_token}")
        print_info(f"User ID: {user_id}")
        
        return True
    else:
        print_error("Signin endpoint is not working")
        return False

def test_update_display_name():
    """Test the update display name endpoint"""
    print_header("Testing Update Display Name Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    display_name_data = {
        "display_name": f"Test User {uuid.uuid4().hex[:8]}"
    }
    
    response = make_request('post', '/user/display-name', data=display_name_data, with_auth=True)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Update display name endpoint is working")
        return True
    else:
        print_error("Update display name endpoint is not working")
        return False

def test_voice_chat():
    """Test the voice chat endpoint"""
    print_header("Testing Voice Chat Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    voice_chat_data = {
        "message": "Hello, how can you help me with my fitness goals?",
        "session_id": str(uuid.uuid4())
    }
    
    response = make_request('post', '/voice-chat', data=voice_chat_data, with_auth=True)
    
    if response and 'response' in response and 'session_id' in response:
        print_success("Voice chat endpoint is working")
        return True
    else:
        print_error("Voice chat endpoint is not working")
        return False

def test_create_goal():
    """Test the create goal endpoint"""
    print_header("Testing Create Goal Endpoint")
    
    if not access_token or not user_id:
        print_error("No access token or user ID available. Run signin test first.")
        return False
    
    goal_data = {
        "user_id": user_id,
        "goal_text": f"Test goal {uuid.uuid4().hex[:8]}",
        "target_date": (datetime.datetime.now() + datetime.timedelta(days=30)).isoformat()
    }
    
    response = make_request('post', '/goals', data=goal_data, with_auth=True)
    
    if response and 'goal_id' in response:
        print_success("Create goal endpoint is working")
        
        # Store the goal ID for update and delete tests
        global test_goal_id
        test_goal_id = response['goal_id']
        
        print_info(f"Goal ID: {test_goal_id}")
        
        return True
    else:
        print_error("Create goal endpoint is not working")
        return False

def test_update_goal():
    """Test the update goal endpoint"""
    print_header("Testing Update Goal Endpoint")
    
    if not access_token or not user_id or not test_goal_id:
        print_error("No access token, user ID, or goal ID available. Run create goal test first.")
        return False
    
    goal_data = {
        "user_id": user_id,
        "goal_text": f"Updated test goal {uuid.uuid4().hex[:8]}",
        "completed": True
    }
    
    response = make_request('put', f'/goals/{test_goal_id}', data=goal_data, with_auth=True)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Update goal endpoint is working")
        return True
    else:
        print_error("Update goal endpoint is not working")
        return False

def test_delete_goal():
    """Test the delete goal endpoint"""
    print_header("Testing Delete Goal Endpoint")
    
    if not access_token or not test_goal_id:
        print_error("No access token or goal ID available. Run create goal test first.")
        return False
    
    response = make_request('delete', f'/goals/{test_goal_id}', with_auth=True)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Delete goal endpoint is working")
        return True
    else:
        print_error("Delete goal endpoint is not working")
        return False

def test_send_notification():
    """Test the send notification endpoint"""
    print_header("Testing Send Notification Endpoint")
    
    if not access_token or not user_id:
        print_error("No access token or user ID available. Run signin test first.")
        return False
    
    notification_data = {
        "user_id": user_id,
        "message": f"Test notification {uuid.uuid4().hex[:8]}",
        "type": "info"
    }
    
    response = make_request('post', '/notifications', data=notification_data, with_auth=True)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Send notification endpoint is working")
        return True
    else:
        print_error("Send notification endpoint is not working")
        return False

def test_get_interventions():
    """Test the get interventions endpoint"""
    print_header("Testing Get Interventions Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/interventions', with_auth=True)
    
    if response and 'interventions' in response:
        print_success("Get interventions endpoint is working")
        return True
    else:
        print_error("Get interventions endpoint is not working")
        return False

def test_detect_pattern():
    """Test the detect pattern endpoint"""
    print_header("Testing Detect Pattern Endpoint")
    
    if not access_token or not user_id:
        print_error("No access token or user ID available. Run signin test first.")
        return False
    
    pattern_data = {
        "user_id": user_id,
        "pattern_type": "missed_workout",
        "pattern_data": {
            "days_missed": 3,
            "last_workout": "2024-06-01"
        }
    }
    
    response = make_request('post', '/patterns', data=pattern_data, with_auth=True)
    
    if response and 'success' in response and response['success'] == True:
        print_success("Detect pattern endpoint is working")
        return True
    else:
        print_error("Detect pattern endpoint is not working")
        return False

def test_get_weekly_report():
    """Test the get weekly report endpoint"""
    print_header("Testing Get Weekly Report Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/weekly-report', with_auth=True)
    
    if response and 'report' in response:
        print_success("Get weekly report endpoint is working")
        return True
    else:
        print_error("Get weekly report endpoint is not working")
        return False

def test_get_dashboard_data():
    """Test the get dashboard data endpoint"""
    print_header("Testing Get Dashboard Data Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/dashboard', with_auth=True)
    
    if response and 'data' in response and response['success'] == True:
        print_success("Get dashboard data endpoint is working")
        return True
    else:
        print_error("Get dashboard data endpoint is not working")
        return False

def test_get_conversation_history():
    """Test the get conversation history endpoint"""
    print_header("Testing Get Conversation History Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/conversation-history', with_auth=True)
    
    if response and 'conversations' in response:
        print_success("Get conversation history endpoint is working")
        return True
    else:
        print_error("Get conversation history endpoint is not working")
        return False

def test_get_user_goals():
    """Test the get user goals endpoint"""
    print_header("Testing Get User Goals Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/user-goals', with_auth=True)
    
    if response and 'goals' in response:
        print_success("Get user goals endpoint is working")
        return True
    else:
        print_error("Get user goals endpoint is not working")
        return False

def test_get_performance_metrics():
    """Test the get performance metrics endpoint"""
    print_header("Testing Get Performance Metrics Endpoint")
    
    if not access_token:
        print_error("No access token available. Run signin test first.")
        return False
    
    response = make_request('get', '/performance-metrics', with_auth=True)
    
    if response and 'user_id' in response:
        print_success("Get performance metrics endpoint is working")
        return True
    else:
        print_error("Get performance metrics endpoint is not working")
        return False

def test_unauthorized_access():
    """Test unauthorized access to protected endpoints"""
    print_header("Testing Unauthorized Access")
    
    # Try to access a protected endpoint without authentication
    response = make_request('get', '/dashboard', with_auth=False)
    
    if response is None:
        print_success("Unauthorized access correctly rejected")
        return True
    else:
        print_error("Unauthorized access not properly handled")
        return False

def run_auth_tests():
    """Run authentication-related tests"""
    print_header("RUNNING AUTHENTICATION TESTS")
    
    results = {
        "signup": test_signup(),
        "signin": test_signin(),
        "update_display_name": test_update_display_name(),
        "unauthorized_access": test_unauthorized_access()
    }
    
    return results

def run_goals_tests():
    """Run goals-related tests"""
    print_header("RUNNING GOALS TESTS")
    
    results = {
        "create_goal": test_create_goal(),
        "update_goal": test_update_goal(),
        "get_user_goals": test_get_user_goals(),
        "delete_goal": test_delete_goal()
    }
    
    return results

def run_dashboard_tests():
    """Run dashboard-related tests"""
    print_header("RUNNING DASHBOARD TESTS")
    
    results = {
        "get_dashboard_data": test_get_dashboard_data(),
        "get_performance_metrics": test_get_performance_metrics(),
        "get_conversation_history": test_get_conversation_history(),
        "get_weekly_report": test_get_weekly_report()
    }
    
    return results

def run_interaction_tests():
    """Run interaction-related tests"""
    print_header("RUNNING INTERACTION TESTS")
    
    results = {
        "voice_chat": test_voice_chat(),
        "send_notification": test_send_notification(),
        "get_interventions": test_get_interventions(),
        "detect_pattern": test_detect_pattern()
    }
    
    return results

def run_all_tests():
    """Run all API tests"""
    print_header("RUNNING ALL API TESTS")
    
    # First test health check
    health_check_result = {"health_check": test_health_check()}
    
    # Run authentication tests first
    auth_results = run_auth_tests()
    
    # If authentication tests pass, run the rest of the tests
    if auth_results["signup"] or auth_results["signin"]:
        goals_results = run_goals_tests()
        dashboard_results = run_dashboard_tests()
        interaction_results = run_interaction_tests()
        
        # Combine all results
        results = {**health_check_result, **auth_results, **goals_results, **dashboard_results, **interaction_results}
    else:
        print_error("Authentication tests failed. Skipping the rest of the tests.")
        results = {**health_check_result, **auth_results}
    
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
