use keyring::credential::{Credential, CredentialApi, CredentialBuilderApi, CredentialPersistence};
use keyring::{set_default_credential_builder, Error, Result};
use std::any::Any;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use wallet::KeyStore;

type SecretMap = Arc<Mutex<HashMap<(String, String), Vec<u8>>>>;

#[derive(Clone, Debug, Default)]
struct InMemoryCredentialBuilder {
    secrets: SecretMap,
}

#[derive(Debug)]
struct InMemoryCredential {
    service: String,
    user: String,
    secrets: SecretMap,
}

impl CredentialApi for InMemoryCredential {
    fn set_secret(&self, secret: &[u8]) -> Result<()> {
        self.secrets
            .lock()
            .unwrap()
            .insert((self.service.clone(), self.user.clone()), secret.to_vec());
        Ok(())
    }

    fn get_secret(&self) -> Result<Vec<u8>> {
        self.secrets
            .lock()
            .unwrap()
            .get(&(self.service.clone(), self.user.clone()))
            .cloned()
            .ok_or(Error::NoEntry)
    }

    fn delete_credential(&self) -> Result<()> {
        self.secrets
            .lock()
            .unwrap()
            .remove(&(self.service.clone(), self.user.clone()))
            .map(|_| ())
            .ok_or(Error::NoEntry)
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

impl CredentialBuilderApi for InMemoryCredentialBuilder {
    fn build(&self, _target: Option<&str>, service: &str, user: &str) -> Result<Box<Credential>> {
        Ok(Box::new(InMemoryCredential {
            service: service.to_owned(),
            user: user.to_owned(),
            secrets: Arc::clone(&self.secrets),
        }))
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn persistence(&self) -> CredentialPersistence {
        CredentialPersistence::ProcessOnly
    }
}

#[test]
fn key_store_roundtrips_secret() {
    set_default_credential_builder(Box::new(InMemoryCredentialBuilder::default()));

    let store = KeyStore::new("dex-trading-agent.test");
    let account = "provider:primary";
    let secret = "super-secret";

    store.set_secret(account, secret).unwrap();

    let loaded = store.get_secret(account).unwrap();
    assert_eq!(loaded, secret);

    store.delete_secret(account).unwrap();

    let error = store.get_secret(account).unwrap_err();
    assert!(matches!(
        error.downcast_ref::<Error>(),
        Some(Error::NoEntry)
    ));
}
