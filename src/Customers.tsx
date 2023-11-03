import { StoreData,store, selectCustomerWithId, CustomerPOJO, deleteCustomerAction,updateCustomerAction, purchasesSelector, customersSelector, selectProductWithId, productsSelector } from './redux_nonsense';
import { ReactElement, useState } from "react";
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Purchase } from './redux_nonsense';
import { useParams } from 'react-router-dom';
import { ProductsCombobox } from './Products';
export class Customer{
	_id : number;
	_name : string;

	constructor(
		id : number,
		name : string,
	){
		this._id=id;
		this._name=name;
	}

	
	createLink() : ReactElement {

		return <Link to={"/customers/"+this._id.toString()}>{this._name}</Link>;
	}
	createTableRow() : ReactElement{
		const purchases_this_customer_bought=useSelector((data : StoreData)=>purchasesSelector(data, this));
		const products = useSelector(productsSelector);
		const [isBuying, isBuyingSetter] = useState(false);

		if (purchases_this_customer_bought.length == 0){
			return <tr>
				<td>{this.createLink()}</td>
				<td>&nbsp;</td>
				<td>&nbsp;</td>
				<td>
				<button onClick={()=>{isBuyingSetter(true)}}>Buy Product</button>
				{isBuying?<ProductsCombobox customer={this} isBuyingSetter={isBuyingSetter}/>:<></>}
				</td>
			</tr>;
		} else {
			return <tr>
				<td>{this.createLink()}</td>
				
				<td>{purchases_this_customer_bought.map(purchase=>
					<>{products.find(product=>product.id==purchase.product_id)!!._name}<br/></>
				)}</td>
				<td>{purchases_this_customer_bought.map(purchase=>
					<>{new Date(purchase.date_of_purchase).toUTCString()}<br/></>
				)}</td>
				<td>
				<button onClick={()=>{isBuyingSetter(true)}}>Buy Product</button>
				{isBuying?<ProductsCombobox customer={this} isBuyingSetter={isBuyingSetter}/>:<></>}
				</td>
			</tr>;
		}
	}
	copy(){
		const result = new Customer(
			this._id,
			this._name
		);
		return result;
	}
	getPurchases() : Purchase[]{
		return store.getState().purchases.
			map(purchase=>purchase.obj).
			filter(purchase=>purchase.customer_id==this._id);
	}
	toPOJO() : CustomerPOJO {
		return {
			id : this._id,
			name: this._name
		};
	}
	static fromPOJO(pojs : CustomerPOJO) : Customer {
		let result = new Customer(pojs.id, pojs.name);
		return result;
	}

	get id() : number{
		return this._id;
	}
	get name() : string{ 
		return this._name;
	}
	createEditPage(): ReactElement {
		const [name_state, setName]=useState(this._name);
		const purchases_this_customer_bought=useSelector((state:StoreData)=>purchasesSelector(state,this));
		const products=useSelector(productsSelector);
		return <>
			<button onClick={
				()=>{store.dispatch(deleteCustomerAction(this.toPOJO()))}
			}>Delete</button><br/>
			<input type="text" value={name_state} onChange={e=>setName(e.target.value)}/>

			<button onClick={()=>{
				const new_customer=new Customer(
					this._id,
					name_state
				);
				store.dispatch(updateCustomerAction(new_customer.toPOJO()));
			}
			}>Update</button><br/>

			{purchases_this_customer_bought.map(
				purchase=><><Link to={"/products/"+purchase.product_id.toString()}>{products.find(product=>purchase.product_id==product.id)!!._name}</Link><br/></>
			)}

		</>;
	}
	
}
export function CustomersPage() {
	const customers = useSelector(customersSelector);
	return <>
		<table>
			<thead>
			<tr><th>Name</th><th>Purchased Products</th><th>Date</th></tr>
			</thead><tbody>
			{customers.map(customer => customer.createTableRow())}
			</tbody>
		</table>
	</>;
}
export function EditCustomerPage(){
	const {id} = useParams();
	const customer=id?useSelector((data:StoreData)=>selectCustomerWithId(data, Number.parseInt(id))):undefined;
	return customer?customer.createEditPage():"Customer Not Found";
}
