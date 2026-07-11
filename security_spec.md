# Firebase Security Specification & TDD Spec

## 1. Data Invariants

*   **Orders**:
    *   Must have a unique document ID, which matches standard string limits.
    *   `orderNumber` must be a string of size 1 to 20.
    *   `confirmationCode` must be a string of size 1 to 10.
    *   `patronName` must be a string of size 1 to 100.
    *   `tableNumber` must be a string of size 1 to 50.
    *   `total` must be a positive number.
    *   `status` must be one of: `'Sent'`, `'Preparing'`, `'Served'`, `'Completed'`, `'Cancelled'`.
    *   `createdAt` is a timestamp number and is immutable after creation.
    *   `timestamp` must be a string.

*   **Staff Profiles**:
    *   `name` must be a string of size 1 to 100.
    *   `pin` must be a string of size 4 to 10.
    *   `clockedIn` must be a boolean (optional).

*   **Admin Config**:
    *   `dns_settings` must contain all required string fields (`senderDomain`, `spfRecord`, etc.) of valid size, and `spfVerified`, `dkimVerified` booleans. No extra fields allowed.
    *   `admin_settings` passcode must be a string.

---

## 2. The "Dirty Dozen" Payloads (Exploit Attempts)

1.  **Exploit 1: Negative Order Total**
    *   Payload: `{ orderNumber: "100", confirmationCode: "1234", patronName: "Joe", tableNumber: "T1", total: -100, status: "Sent", createdAt: 12345678, timestamp: "18:00" }`
    *   Target: `orders/{orderId}` (create)
    *   Expectation: `PERMISSION_DENIED`

2.  **Exploit 2: Missing Required Order Number**
    *   Payload: `{ confirmationCode: "1234", patronName: "Joe", tableNumber: "T1", total: 150, status: "Sent", createdAt: 12345678, timestamp: "18:00" }`
    *   Target: `orders/{orderId}` (create)
    *   Expectation: `PERMISSION_DENIED`

3.  **Exploit 3: Massive ID / Field Poisoning (Denial of Wallet)**
    *   Payload: `{ orderNumber: "A".repeat(1000), confirmationCode: "1234", patronName: "Joe", tableNumber: "T1", total: 150, status: "Sent", createdAt: 12345678, timestamp: "18:00" }`
    *   Target: `orders/{orderId}` (create)
    *   Expectation: `PERMISSION_DENIED`

4.  **Exploit 4: Invalid Order Status**
    *   Payload: `{ orderNumber: "100", confirmationCode: "1234", patronName: "Joe", tableNumber: "T1", total: 150, status: "HACKED_STATUS", createdAt: 12345678, timestamp: "18:00" }`
    *   Target: `orders/{orderId}` (create)
    *   Expectation: `PERMISSION_DENIED`

5.  **Exploit 5: Overwriting Immutable Order Timestamp**
    *   Payload: `{ orderNumber: "100", confirmationCode: "1234", patronName: "Joe", tableNumber: "T1", total: 150, status: "Sent", createdAt: 99999999, timestamp: "18:00" }`
    *   Target: `orders/{orderId}` (update) where existing `createdAt` was `12345678`.
    *   Expectation: `PERMISSION_DENIED`

6.  **Exploit 6: Overwriting Order Details (Integrity Bypass)**
    *   Payload: Changing `patronName` or `total` in an update when only status change was requested.
    *   Target: `orders/{orderId}` (update)
    *   Expectation: `PERMISSION_DENIED`

7.  **Exploit 7: Short PIN Staff Profile (Security Bypass)**
    *   Payload: `{ name: "Bob", pin: "12" }`
    *   Target: `staff_profiles/{profileId}` (create)
    *   Expectation: `PERMISSION_DENIED`

8.  **Exploit 8: Missing PIN Staff Profile**
    *   Payload: `{ name: "Bob" }`
    *   Target: `staff_profiles/{profileId}` (create)
    *   Expectation: `PERMISSION_DENIED`

9.  **Exploit 9: Invalid Key in Staff Profile**
    *   Payload: `{ name: "Bob", pin: "1234", isAdmin: true }`
    *   Target: `staff_profiles/{profileId}` (create)
    *   Expectation: `PERMISSION_DENIED` (Strict schema prevents ghost fields)

10. **Exploit 10: Ghost Field in Admin settings**
    *   Payload: `{ passcode: "9999", securityBypass: true }`
    *   Target: `admin_config/admin_settings` (create/update)
    *   Expectation: `PERMISSION_DENIED`

11. **Exploit 11: Invalid Types in DNS Settings**
    *   Payload: `{ senderDomain: true, spfRecord: 1234, dkimSelector: "abc" }`
    *   Target: `admin_config/dns_settings` (create/update)
    *   Expectation: `PERMISSION_DENIED`

12. **Exploit 12: Invalid Path Access**
    *   Accessing a non-existent path or collection like `match /secret_hack/{doc}`
    *   Expectation: `PERMISSION_DENIED` (handled by Global default-deny)
