import { initializeApp, getApps } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDeI0f_zLoNva30VIEUfi_ZVYAY_1xHZQY',
  authDomain: 'navi-pharma.firebaseapp.com',
  databaseURL: 'https://navi-pharma-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'navi-pharma',
  storageBucket: 'navi-pharma.firebasestorage.app',
  messagingSenderId: '266686552390',
  appId: '1:266686552390:web:704a1d368518bd8d79ed47',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getDatabase(app)
