# TB1 functional corrections

This branch builds on the team's current develop integration and preserves its Vue, Pinia, Axios and PrimeVue runtime.

- Rentals recognizes completed writes even when responses fail, correlates reservations with their request, and prevents duplicate rentals, deliveries and returns during retries. Compensation only reverses confirmed changes belonging to the operation; uncertain outcomes require record inspection.
- Inspected equipment returned for maintenance can resume service without a fictitious incident. Open blocking incidents and active rentals still prevent reactivation.
- Route checks reject the wrong role, missing plan access, failed API checks and approvals from a previous session. Failures show a notice instead of opening restricted screens.
- Equipment codes are unique per provider in the Fake API, including competing creates and updates.
- Scheduled maintenance blocks only its calendar day in Lima. Derived blocks are not persisted during equipment updates; completing or deleting the schedule releases them without removing rental reservations.
- The dashboard handles optional contexts and prices follow the selected locale. Navigation preserves the coordinator's plan controls and adds access to incidents.

Regression tests exercise real stores, adapters, transport failures and HTTP endpoints with temporary databases. Composition tests resolve seven stores and load eleven context views.

This is a Fake API demonstration. Compensation does not establish distributed transactions, production authorization, cross-tab operation idempotency or real billing. Production backend guarantees remain outside the TB1 demo.
