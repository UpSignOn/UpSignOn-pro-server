# Behavior

- admins can create several Shamir configs
- when a recipient is added to the Shamir config, users must update their Shamir backup
- when a recipient is removed from the Shamir config, users do not have to update their Shamir backup (debatable)
- if a user's level is updated, he will have to update his Shamir backup on his next sync
- to activate a Shamir backup, a device must be first enrolled. The device's private/public key will be used to transfer the backup safely to the user.
- before deleting a vault, we should check this does not break a Shamir config
- the shamir configs should not be updatable (except for recipient list) to prevent complicated cases in the code

---

Should a recipient be able to transfer his shares to a new admin ?
YES probably to avoid danger zone when that recipient leaves the company
But that's also dangerous because it could let someone escalate until having enough shares to unlock high level vaults.

---

HOW to handle backups for first users of a bank ?

---

Should it be possible to have several shamir backups ? does it make sense in terms of security ?

---

# Constraints on number of shares

- Shamir configs should always have at least k+1 shares for a k min config for security
- Shamir configs should not be broken by the deletion of one recipient (that is important when recipients have more than one share because of the loss of such recipients could break all the backups)

# Technical details
