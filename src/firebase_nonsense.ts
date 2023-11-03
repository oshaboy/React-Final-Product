import { initializeApp } from 'firebase/app';
import { getFirestore, onSnapshot, query, collection, setDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import {
	ProductPOJO,CustomerPOJO, Purchase,
	loadProductDatabaseAction, loadCustomerDatabaseAction, loadPurchasesDatabaseAction,
	databasePostSyncAction,
	store,
	FirestoreState, Firebaseable, validate
} from './redux_nonsense';
const firebaseConfig = {
  apiKey: "AIzaSyC0SbJPoIf86WCkZFqHLLrTz40HHmTN7tk",
  authDomain: "bronze-yaniv-storefront.firebaseapp.com",
  projectId: "bronze-yaniv-storefront",
  storageBucket: "bronze-yaniv-storefront.appspot.com",
  messagingSenderId: "309229580921",
  appId: "1:309229580921:web:cccc7cf36ff7c48cd1daa8"
};
// Initialize Firebase
export const database = getFirestore(initializeApp(firebaseConfig));
export function downloadFirebase(){
	let complete_count = 0;
	const onComplete = ()=>{
		/* Hopefully this isn't a race condition */
		complete_count++;
		if (complete_count >= 3) store.dispatch(validate());
	};
	onSnapshot(
		query(collection(database,"products")),
		(snapshot) => {
			console.log(snapshot.docs);
			store.dispatch(loadProductDatabaseAction(snapshot.docs.map(
				product_doc=>product_doc.data() as ProductPOJO
			)));
			onComplete();
		}
	);
	onSnapshot(
		query(collection(database,"customers")),
		(snapshot) => {
			console.log(snapshot.docs);
			store.dispatch(loadCustomerDatabaseAction(snapshot.docs.map(
				customer_doc=>customer_doc.data() as CustomerPOJO
			)));
			onComplete();
		}
	);
	onSnapshot(
		query(collection(database,"purchases")),
		(snapshot) => {
			console.log(snapshot.docs);
			store.dispatch(loadPurchasesDatabaseAction(snapshot.docs.map(
				purchase_doc=>{
					const raw_date : Timestamp = purchase_doc.data().date_of_purchase;
					return {...purchase_doc.data(), date_of_purchase: raw_date.toMillis()} as Purchase
				}
			)));
			onComplete();
		}
	);
}
export function syncFirebase(){
	let promises : Promise<any>[] = [];
	const update=(arr: Firebaseable<any>[], db_name : string)=>{
		for (const idx in arr){
			const thing = arr[idx];
			switch (thing.storestate){
				case FirestoreState.UPDATE:
					promises.push(setDoc(doc(database, db_name, thing.obj.id.toString()),thing.obj));
				break;
				case FirestoreState.DELETE:
					promises.push(deleteDoc(doc(database, db_name, thing.obj.id.toString())));
				break;
				default: 
					console.log(`No such Storestate ${thing.storestate}`);
				break;
				case FirestoreState.NOP:
				break;
			}
		}
	}
	update(store.getState().products, "products");
	update(store.getState().customers, "customers");
	update(store.getState().purchases.map(
		purchase=>{
			return {
				obj: {...purchase.obj,
					date_of_purchase:Timestamp.fromMillis(purchase.obj.date_of_purchase)
				},
				storestate:purchase.storestate
			};
		}
	), "purchases");
	if (promises.length!==0)
		Promise.all(promises).then(()=>store.dispatch(databasePostSyncAction()));
}