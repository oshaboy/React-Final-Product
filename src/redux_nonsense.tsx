import { createSelector,configureStore, Action, createAction, Store } from '@reduxjs/toolkit';
import { Product } from './Products.tsx';
import { Customer } from './Customers.tsx';
export enum FirestoreState {
	NOP,
	UPDATE,
	DELETE
};
export type ProductPOJO = {
	id: number,
	name: string
	price : number,
	quantity: number
};
export type CustomerPOJO = {
	id: number,
	name: string
};
export type Purchase={
	id : number,
	customer_id : number,
	product_id : number,
	date_of_purchase : number
};
export type Firebaseable<Type> ={
	obj :Type,
	storestate : FirestoreState
};
export type StoreData={
	isvalid : boolean,
	products : Firebaseable<ProductPOJO>[],
	customers : Firebaseable<CustomerPOJO>[],
	purchases : Firebaseable<Purchase>[]
};
export const buyAction = createAction<{product:ProductPOJO, customer:CustomerPOJO}>("Buy");
export const deleteProductAction = createAction<ProductPOJO>("Delete Product");
export const deleteCustomerAction = createAction<CustomerPOJO>("Delete Customer");
export const updateProductAction = createAction<ProductPOJO>("Update Product");
export const updateCustomerAction = createAction<CustomerPOJO>("Update Customer");
export const loadProductDatabaseAction = createAction<ProductPOJO[]>("Load Product Database");
export const loadCustomerDatabaseAction = createAction<CustomerPOJO[]>("Load Customer Database");
export const loadPurchasesDatabaseAction = createAction<Purchase[]>("Load Purchases Database");
export const databasePostSyncAction = createAction("Post Sync Database");
export const validate = createAction("Validate");
let purchase_id = 0;
function filterFirebasable<T>(firebasables: Firebaseable<T>[]) : T[]{
	return firebasables.
		filter(product=>product.storestate!==FirestoreState.DELETE).
		map(product=>product.obj)
}

export const productsSelector = createSelector(
	[(store_data:StoreData) => {
		
		console.log(store_data.products);
		const products=filterFirebasable(store_data.products);
		console.log(products);
		return products;

	}],
	(products : ProductPOJO[])=>products.map(product=>Product.fromPOJO(product))
);

export const customersSelector = createSelector(
	[(store_data:StoreData) => filterFirebasable(store_data.customers)],
	(customers:CustomerPOJO[]) => {return customers.map(customer=>Customer.fromPOJO(customer));}
);

export const purchasesSelector = createSelector(
	[
		(store_data:StoreData) => filterFirebasable(store_data.purchases),
		(_:StoreData,customer_or_product? : Customer | Product)=>customer_or_product
	],
	(purchases :Purchase[], customer_or_product? : Customer | Product)=>{
		if (customer_or_product === undefined){
			return purchases;
		} else if (customer_or_product instanceof Product){
			return purchases.filter(purchase=>purchase.product_id==customer_or_product.id);
		} else /*if (customer_or_product instanceof Customer)*/ {
			return purchases.filter(purchase=>purchase.customer_id==customer_or_product.id);
		}
	}
);

export const selectProductWithId = createSelector(
	[
		(store_data: StoreData)=>filterFirebasable(store_data.products),
		(_:StoreData,id:number)=>id
	],
	(products: ProductPOJO[], id: number)=>{
		const product=products.find(product=>product.id==id);
		if (product === undefined) return undefined;
		else return Product.fromPOJO(product);
	}
); 

export const selectCustomerWithId = createSelector(
	[
		(store_data: StoreData)=>filterFirebasable(store_data.customers),
		(_:StoreData,id:number)=>id
	],
	(customers: CustomerPOJO[], id: number)=>{
		const customer=customers.find(customer=>customer.id==id);
		if (customer === undefined) return undefined;
		else return Customer.fromPOJO(customer);
	}
);

export const store=configureStore({reducer: 
	(data_accumulator : StoreData, action : Action) : StoreData => {
		let result : StoreData  = {
			isvalid : false,
			products : [],
			customers : [],
			purchases : []
		};
		if (loadProductDatabaseAction.match(action)){
			result = {
				...data_accumulator,
				products : action.payload.map(product=>{return {obj :product ,storestate: FirestoreState.NOP}})
			};
		} else if (loadCustomerDatabaseAction.match(action)) {
			result = {
				...data_accumulator,
				customers : action.payload.map(customer=>{return {obj : customer ,storestate: FirestoreState.NOP}})
			};
		} else if (loadPurchasesDatabaseAction.match(action)){
			result = {
				...data_accumulator,
				purchases : action.payload.map(purchase=>{return {obj :purchase ,storestate: FirestoreState.NOP}})
			};
	 	} else if (buyAction.match(action)){
			while (data_accumulator.purchases.find(purchase=>purchase_id==purchase.obj.id)!==undefined)
				purchase_id++;
			const purchase : Purchase = {
				id : purchase_id,
				customer_id : action.payload.customer.id,
				product_id : action.payload.product.id,
				date_of_purchase : Date.now()
			};
			console.log(purchase);
			result = {
				...data_accumulator,
				purchases : [...data_accumulator.purchases, {obj: purchase, storestate:FirestoreState.UPDATE}]
			};
		} else if (deleteProductAction.match(action)){
			const product_index = data_accumulator.products.findIndex(p=>action.payload.id == p.obj.id);
			let new_product_array = [...data_accumulator.products];
			new_product_array[product_index] = {...new_product_array[product_index],storestate:FirestoreState.DELETE};
			
			result = {
				...data_accumulator,
				products : new_product_array,
				purchases : data_accumulator.purchases.map(purchase=>{
					if (purchase.obj.product_id == action.payload.id){
						return {obj: purchase.obj, storestate: FirestoreState.DELETE}
					} else return purchase;
				})
			};
		} else if (deleteCustomerAction.match(action)){
			const customer_index = data_accumulator.customers.findIndex(p=>action.payload.id == p.obj.id);
			let new_customer_array = [...data_accumulator.customers];
			new_customer_array[customer_index] = {...new_customer_array[customer_index],storestate:FirestoreState.DELETE};
			
			result = {
				...data_accumulator,
				customers : new_customer_array,
				purchases : data_accumulator.purchases.map(purchase=>{
					if (purchase.obj.customer_id == action.payload.id){
						return {obj: purchase.obj, storestate: FirestoreState.DELETE}
					} else return purchase;
				})
			};
		} else if (updateProductAction.match(action)){

			const product_index = data_accumulator.products.findIndex(p=>action.payload.id == p.obj.id);
			let new_product_array = [...data_accumulator.products];
			new_product_array[product_index]={obj:action.payload,storestate:FirestoreState.UPDATE};

			result = {
				...data_accumulator,
				products : new_product_array
			};
		} else if (updateCustomerAction.match(action)){
			const product_index = data_accumulator.customers.findIndex(p=>action.payload.id == p.obj.id);
			let new_product_array = [...data_accumulator.customers];
			new_product_array[product_index]={obj:action.payload,storestate:FirestoreState.UPDATE};
			result = {
				...data_accumulator,
				customers : new_product_array
			};
		} else if (databasePostSyncAction.match(action)) {
			result = {
				...data_accumulator,
				products : data_accumulator.products.
					filter(product => product.storestate!=FirestoreState.DELETE).
					map(product => {return {obj: product.obj,storestate:FirestoreState.NOP }}),
				customers : data_accumulator.customers.
					filter(customer => customer.storestate!=FirestoreState.DELETE).
					map(customer => {return {obj: customer.obj,storestate:FirestoreState.NOP }}),
				purchases : data_accumulator.purchases.
					filter(purchase => purchase.storestate!=FirestoreState.DELETE).
					map(purchase => {return {obj : purchase.obj, storestate:FirestoreState.NOP}}),
			}
		} else if (validate.match(action)){
			result={
				...data_accumulator,
				isvalid : true
			};
		}
		console.log(result);
		return result;
	}
});