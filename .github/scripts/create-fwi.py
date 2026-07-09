#!/usr/bin/env python3
"""
Script to extract Future Work Item information from a pull request description/body
and send to Jira Automation webhook.
"""

import re
import os
import sys
import hashlib
from typing import Optional, Dict, Any

LABEL_PREFIX = "fwi-sent:"

def extract_future_work_item_from_pr(pr_body: str) -> Optional[Dict[str, str]]:
    """
    Extract Future Work Item information from PR description/body text.
    
    Expected format in PR description(must be the final section of the PR):
    /FWI
    Title: <title>
    Description: <description>
    Reason: <reason>
    
    Args:
        pr_body: Pull request description/body text
        
    Returns:
        Dictionary with 'title', 'description', 'reason' keys if found,
        None otherwise
    """
    if not pr_body:
        return None
        
    regex = re.compile(
        r'/FWI\s*[\r\n]+Title:\s*(.+?)\s*[\r\n]+Description:\s*([\s\S]*?)\s*[\r\n]+Reason:\s*([\s\S]*)',
        re.IGNORECASE
    )
    
    match = regex.search(pr_body)
    if not match:
        return None
    
    title = match.group(1).strip()
    if not title:
        return None
    
    return {
        'title': title,
        'description': match.group(2).strip(),
        'reason': match.group(3).strip()
    }

def label_for_title(title: str) -> str:
    """Build a stable label from a hash of the title"""
    title_hash = hashlib.sha256(title.encode("utf-8")).hexdigest()[:12]
    return f"{LABEL_PREFIX}{title_hash}"


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
        print("⚠️  Warning: requests library not installed. Run: pip install requests", file=sys.stderr)
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
        print(f"❌ Error sending to Jira: {e}", file=sys.stderr)
        return False


def main():
    """Main entry point for the script."""
    
    pr_body = os.environ.get('PR_BODY', '')
    if not pr_body:
        print("ℹ️  No PR body found, skipping FWI extraction", file=sys.stderr)
        sys.exit(0)  # not an error, just nothing to process
    
    fwi_data = extract_future_work_item_from_pr(pr_body)
    if not fwi_data:
        print("ℹ️  No Future Work Item found in PR description - continuing...", file=sys.stderr)
        sys.exit(0)
    
    repo = os.environ.get('GITHUB_REPOSITORY', '')
    pr_number = int(os.environ.get('PR_NUMBER', 0))
    gh_token = os.environ.get('GITHUB_TOKEN')
    new_label = label_for_title(fwi_data['title'])

    if repo and pr_number and gh_token:
        try:
            existing_labels = get_pr_labels(repo, pr_number, gh_token)
            if new_label in existing_labels:
                print(f"ℹ️  FWI '{fwi_data['title']}' already sent - skipping duplicate.", file=sys.stderr)
                sys.exit(0)
        except Exception as e:
            print(f"⚠️  Could not check existing labels: {e}", file=sys.stderr)

    
    # configuration from environment
    webhook_url = os.environ.get('JIRA_AUTOMATION_WEBHOOK')
    token = os.environ.get('JIRA_AUTOMATION_TOKEN')
    
    if not webhook_url or not token:
        print("⚠️  Warning: JIRA_AUTOMATION_WEBHOOK and JIRA_AUTOMATION_TOKEN not configured", file=sys.stderr)
        sys.exit(0)
    
    # payload with PR metadata
    payload = {
        'title': fwi_data['title'],
        'description': fwi_data['description'],
        'reason': fwi_data['reason'],
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
                print(f"⚠️  Sent to Jira but failed to add tracking label: {e}", file=sys.stderr)
        sys.exit(0)
    else:
        print("⚠️  Failed to send Future Work Item to Jira - continuing anyway", file=sys.stderr)
        sys.exit(0)


if __name__ == '__main__':
    main()