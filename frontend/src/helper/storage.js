import { EncryptStorage } from "encrypt-storage";

export const encryptStorage = new EncryptStorage(process.env.REACT_APP_LSKEY, {
  prefix: "@PRO",
  storageType: "sessionStorage",
});
