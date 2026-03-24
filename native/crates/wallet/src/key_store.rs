use anyhow::Result;
use keyring::Entry;

#[derive(Clone, Debug)]
pub struct KeyStore {
    service: String,
}

impl KeyStore {
    pub fn new(service: impl Into<String>) -> Self {
        Self {
            service: service.into(),
        }
    }

    pub fn set_secret(&self, account: &str, secret: &str) -> Result<()> {
        self.entry(account)?.set_password(secret)?;
        Ok(())
    }

    pub fn get_secret(&self, account: &str) -> Result<String> {
        self.entry(account)?.get_password().map_err(Into::into)
    }

    pub fn delete_secret(&self, account: &str) -> Result<()> {
        self.entry(account)?.delete_credential()?;
        Ok(())
    }

    fn entry(&self, account: &str) -> Result<Entry> {
        Entry::new(&self.service, account).map_err(Into::into)
    }
}
