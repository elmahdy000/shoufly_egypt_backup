import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:5000"

def check_no_errors(page, page_name, page_errors):
    # Check if any unhandled client-side JavaScript errors occurred
    if page_errors:
        errors_str = "; ".join(page_errors)
        raise RuntimeError(f"Uncaught browser exception on page {page_name}: {errors_str}")
        
    # Inspect content for common Next.js error overlays or runtime exceptions
    content = page.content().lower()
    error_keywords = [
        "unhandled runtime error", 
        "failed to compile", 
        "application error: a client-side exception has occurred",
        "internal server error",
        "next.js compiler error",
        "unhandled exception",
        "حدث خطأ غير متوقع",
        "تفاصيل الخطأ"
    ]
    for keyword in error_keywords:
        if keyword in content:
            raise RuntimeError(f"Found error keyword '{keyword}' on page {page_name}")

def run_tests():
    os.makedirs("screenshots", exist_ok=True)
    print("============================================================")
    print(">>> STARTING SHOOFLY EGYPT UI VERIFICATION TEST SUITE <<<")
    print("============================================================")

    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        
        # 1. Public Pages Verification
        print("\n[1/5] Testing Public/Static Pages...")
        context = browser.new_context()
        page = context.new_page()
        page.set_default_timeout(90000) # 90 seconds timeout
        
        page_errors = []
        page.on("pageerror", lambda err: page_errors.append(err.message))
        
        # Landing Page
        print("   Checking Landing Page (/) ...")
        page_errors.clear()
        page.goto(f"{BASE_URL}/")
        page.wait_for_load_state("load")
        time.sleep(1.0)
        check_no_errors(page, "Landing", page_errors)
        page.screenshot(path="screenshots/01_landing.png")
        print("   -> Landing page rendered successfully.")
        
        # Login Page
        print("   Checking Login Page (/login) ...")
        page_errors.clear()
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("load")
        time.sleep(1.0)
        check_no_errors(page, "Login", page_errors)
        page.screenshot(path="screenshots/02_login.png")
        print("   -> Login page rendered successfully.")
        
        # Register Page
        print("   Checking Register Page (/register) ...")
        page_errors.clear()
        page.goto(f"{BASE_URL}/register")
        page.wait_for_load_state("load")
        time.sleep(1.0)
        check_no_errors(page, "Register", page_errors)
        page.screenshot(path="screenshots/03_register.png")
        print("   -> Register page rendered successfully.")
        context.close()

        # Shared role crawler helper
        def crawl_role_pages(role_name, email, password, pages):
            print(f"\n[*] Testing {role_name} Dashboard Pages (login: {email})...")
            role_context = browser.new_context()
            role_page = role_context.new_page()
            role_page.set_default_timeout(90000) # 90 seconds timeout
            
            role_errors = []
            role_page.on("pageerror", lambda err: role_errors.append(err.message))
            
            # Login using Developer Fast Access buttons
            role_page.goto(f"{BASE_URL}/login")
            role_page.wait_for_load_state("load")
            # Wait briefly to ensure React hydration is complete
            time.sleep(1.5)
            
            role_btn_map = {
                "Client": "عميل",
                "Vendor": "تاجر",
                "Delivery": "مندوب",
                "Admin": "أدمن"
            }
            btn_text = role_btn_map.get(role_name)
            if btn_text:
                role_page.click(f'text="{btn_text}"')
            else:
                role_page.fill('input[type="email"]', email)
                role_page.fill('input[type="password"]', password)
                role_page.click('button[type="submit"]')
            
            # Wait for redirect and complete authentication state setup
            try:
                role_page.wait_for_url(lambda u: "/login" not in u, timeout=30000)
            except Exception as e:
                role_page.screenshot(path=f"screenshots/err_login_timeout_{role_name.lower()}.png")
                print(f"      [ERROR] Login redirect failed for {role_name}: {e}")
                print(f"      Current URL: {role_page.url}")
                print(f"      Page Content: {role_page.locator('body').text_content()[:200]}")
                raise e
            time.sleep(1.0)
            role_errors.clear()
            
            for path, name in pages:
                full_url = f"{BASE_URL}{path}"
                print(f"   -> Crawling: {path} ({name}) ...")
                role_errors.clear()
                
                try:
                    role_page.goto(full_url)
                    role_page.wait_for_load_state("load")
                    # Give component hooks and charts time to mount
                    time.sleep(1.5)
                    
                    check_no_errors(role_page, f"{role_name} - {name}", role_errors)
                    
                    # Safe filename creation
                    safe_name = name.lower().replace(" ", "_").replace("/", "_")
                    filename = f"screenshots/{role_name.lower()}_{safe_name}.png"
                    role_page.screenshot(path=filename)
                    print(f"      [OK] Rendered (saved: {filename})")
                except Exception as ex:
                    print(f"      [FAIL] page {path}: {ex}")
                    # Capture error screenshot for debugging
                    role_page.screenshot(path=f"screenshots/err_{role_name.lower()}_{name.lower()}.png")
                    raise ex
                
            role_context.close()

        # 2. Client Pages Verification
        client_pages = [
            ("/client", "Dashboard"),
            ("/client/profile", "Profile"),
            ("/client/wallet", "Wallet"),
            ("/client/requests", "Requests"),
            ("/client/chat", "Chat"),
            ("/client/complaints", "Complaints"),
            ("/client/delivery/1", "Delivery"),
            ("/client/notifications", "Notifications"),
            ("/client/offers/request/1", "Offers")
        ]
        crawl_role_pages("Client", "client1@shoofly.com", "password123", client_pages)

        # 3. Vendor Pages Verification
        vendor_pages = [
            ("/vendor", "Dashboard"),
            ("/vendor/profile", "Profile"),
            ("/vendor/earnings", "Earnings"),
            ("/vendor/requests", "Requests"),
            ("/vendor/bids", "Bids"),
            ("/vendor/notifications", "Notifications"),
            ("/vendor/withdrawals", "Withdrawals")
        ]
        crawl_role_pages("Vendor", "vendor1@shoofly.com", "password123", vendor_pages)

        # 4. Delivery Agent Pages Verification
        delivery_pages = [
            ("/delivery", "Dashboard"),
            ("/delivery/profile", "Profile"),
            ("/delivery/tasks", "Tasks"),
            ("/delivery/notifications", "Notifications")
        ]
        crawl_role_pages("Delivery", "delivery1@shoofly.com", "password123", delivery_pages)

        # 5. Admin Pages Verification
        admin_pages = [
            ("/admin", "Dashboard"),
            ("/admin/users", "Users"),
            ("/admin/vendors", "Vendors"),
            ("/admin/requests", "Requests"),
            ("/admin/kyc", "KYC"),
            ("/admin/complaints", "Complaints"),
            ("/admin/finance", "Finance"),
            ("/admin/settings", "Settings"),
            ("/admin/analytics", "Analytics"),
            ("/admin/audit-logs", "Audit Logs"),
            ("/admin/refunds", "Refunds"),
            ("/admin/tracking", "Tracking"),
            ("/admin/vision", "Vision"),
            ("/admin/withdrawals", "Withdrawals")
        ]
        crawl_role_pages("Admin", "admin@shoofly.com", "password123", admin_pages)

        browser.close()
        print("\n============================================================")
        print(">>> ALL UI PAGES CRAWLED AND VERIFIED SUCCESSFULLY <<<")
        print("============================================================")

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print(f"\n[ERROR] UI VERIFICATION FAILURE: {e}")
        sys.exit(1)
