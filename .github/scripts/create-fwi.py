#!/usr/bin/env python3
"""
Script to extract Future Work Item information from pull request reviews and review comments 
and send to Jira Automation webhook.
"""

import re
import os
import sys
from typing import Optional, Dict, Any

LABEL_PREFIX = "fwi-sent:"

def extract_future_work_item(text: str) -> Optional[Dict[str, str]]:
    """
    Extract Future Work Item information from a review or review comment.
    Expected format:
    FWI: <title>

    Args:
        text: Review or comment body.

    Returns:
        Dictionary containing the title if found, otherwise None.
    """
    if not text:
        return None

    regex = re.compile(
        r'FWI:\s*(.+)',
        re.IGNORECASE
    )

    match = regex.search(text)
    if not match:
        return None

    title = match.group(1).strip()
    if not title:
        return None

    return {
        "title": title
    }


def get_pr_labels(repo: str, pr_number: int, token: str) -> list:
    import requests
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/labels"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    resp = requests.get(url, headers=headers, timeout=15)
    resp.raise_for_status()
    return [label["name"] for label in resp.json()]


def add_label(repo: str, pr_number: int, token: str, label: str) -> None:
    import requests
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/labels"
    headers = {"Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json"}
    requests.post(url, headers=headers, json={"labels": [label]}, timeout=15)


def send_to_jira(payload: Dict[str, Any], webhook_url: str, token: str) -> bool:
    """
    Send payload to Jira automation webhook.
    
    Args:
        payload: Data to send
        webhook_url: Jira webhook endpoint
        token: Authentication token
        
    Returns:
        True if successful, False otherwise
    """
    try:
        import requests
    except ImportError:
        print("Warning: requests library not installed. Run: pip install requests", file=sys.stderr)
        return False
    
    headers = {
        'Content-Type': 'application/json',
        'X-Automation-Webhook-Token': token
    }
    
    try:
        response = requests.post(webhook_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return True
    except requests.RequestException as e:
        print(f"Error sending to Jira: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point for the script."""
    
    event_name = os.environ.get("EVENT_NAME", "")
    if event_name == "pull_request_review":
        review_text = os.environ.get("REVIEW_BODY", "")
        fwi_id = os.environ.get("REVIEW_ID")
    elif event_name == "pull_request_review_comment":
        review_text = os.environ.get("COMMENT_BODY", "")
        fwi_id = os.environ.get("COMMENT_ID")
    else:
        print(f"Unsupported event '{event_name}', skipping.", file=sys.stderr)
        sys.exit(0)

    if not review_text:
        print("No review/comment body found, skipping FWI extraction.", file=sys.stderr)
        sys.exit(0)

    fwi_data = extract_future_work_item(review_text)

    if not fwi_data:
        print("No Future Work Item found in review/comment.", file=sys.stderr)
        sys.exit(0)

    repo = os.environ.get('GITHUB_REPOSITORY', '')
    pr_number = int(os.environ.get('PR_NUMBER', 0))
    gh_token = os.environ.get('GITHUB_TOKEN')
    new_label = f"{LABEL_PREFIX}{fwi_id}"

    if repo and pr_number and gh_token:
        try:
            existing_labels = get_pr_labels(repo, pr_number, gh_token)
            if new_label in existing_labels:
                print(f"FWI '{fwi_data['title']}' already sent - skipping duplicate.", file=sys.stderr)
                sys.exit(0)
        except Exception as e:
            print(f"Could not check existing labels: {e}", file=sys.stderr)

    
    # configuration from environment
    webhook_url = os.environ.get('JIRA_AUTOMATION_WEBHOOK')
    token = os.environ.get('JIRA_AUTOMATION_TOKEN')
    
    if not webhook_url or not token:
        print("Warning: JIRA_AUTOMATION_WEBHOOK and JIRA_AUTOMATION_TOKEN not configured", file=sys.stderr)
        sys.exit(0)
    
    # payload with PR metadata
    payload = {
        'title': fwi_data['title'],
        'repository': repo or 'unknown',
        'author': os.environ.get('GITHUB_ACTOR', 'unknown'),
        'pr_url': os.environ.get('PR_URL', ''),
        'pr_number': pr_number,
        'pr_title': os.environ.get('PR_TITLE', '')
    }
    
    # send to Jira
    if send_to_jira(payload, webhook_url, token):
        print("✅ Future Work Item sent to Jira Automation successfully.")
        if repo and pr_number and gh_token:
            try:
                add_label(repo, pr_number, gh_token, new_label)
            except Exception as e:
                print(f"Sent to Jira but failed to add tracking label: {e}", file=sys.stderr)
        sys.exit(0)
    else:
        print("Failed to send Future Work Item to Jira - continuing anyway", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()