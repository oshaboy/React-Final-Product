import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { StoreData,productsSelector,store, updateProductAction,purchasesSelector, buyAction, customersSelector } from './redux_nonsense';
import { ProductPOJO , deleteProductAction} from './redux_nonsense';
import { ReactElement, useState } from "react";
import { Link } from 'react-router-dom';
import { Customer } from './Customers';
import { selectProductWithId } from './redux_nonsense';
export class Product{
	_id : number;
	_name: string;
	_price : number;
	_quantity : number;
	
	constructor(
		id : number,
		name : string,
		price : number,
		quantity : number,

	){
		if (price < 0)
			throw new Error("Price must be a positive integer");
		if (!Number.isInteger(price))
			throw new Error("Price must be inputted in Agorot");
		this._id=id;
		this._price=price;
		this._quantity=quantity;
		this._name=name;
	}
	copy() : Product{
		return new Product(
			this._id,
			this._name,
			this._quantity,
			this._price
		);
	}
	formatPrice() : string{
		const agorot : number = this._price%100;
		const shekels : number = Math.floor(this._price/100);
		return `₪${shekels}.${agorot<10?"0":""}${agorot}`;
	}

	createElement() : ReactElement {
		const customers=useSelector(customersSelector);
		const purchases_of_this_product = useSelector((store :StoreData)=>purchasesSelector(store, this));
		const [isBuying, isBuyingSetter] = useState(false);

		return <>
			<tr>
			<td>
			<Link to={this._id.toString()}>{this._name}</Link><br/>
			
			Price: {this.formatPrice()}<br/>
			Stock: {this._quantity}<br/>
			</td>
			
			{purchases_of_this_product.map(
				purchase => {
					const customer=customers.find(customer=>customer.id==purchase.customer_id)!!;
					return <td>
					{customer.createLink()} <br/>
					{new Date(purchase.date_of_purchase).toUTCString()}<br/>
					<button onClick={()=>isBuyingSetter(true)}>Add</button>
					{isBuying?<ProductsCombobox isBuyingSetter={isBuyingSetter} customer={customer}/>:<></>}
					</td>;
				}

			)}
			
			</tr> 
		</>;
	}
	createEditPage(): ReactElement {
		const [name_state, setName]=useState(this._name);
		const [price_state, setPrice]=useState(this.formatPrice());
		const [quantity_state, setQuantity]=useState(this._quantity.toString());
		const [quantity_error, setQuantityError]=useState(false);
		const [price_error, setPriceError]=useState(false);

		return <>
			<button onClick={
				()=>{store.dispatch(deleteProductAction(this.toPOJO()))}
			}>Delete</button><br/>
			<input type="text" value={name_state} onChange={e=>setName(e.target.value)}/>
			<input type="text"
				value={price_state}
				style={price_error?{backgroundColor:"red"}:{}}
				onChange={e=>{setPrice(e.target.value)}
			}/>
			<input type="text"
				value={quantity_state}
				style={quantity_error?{backgroundColor:"red"}:{}}
				onChange={e=>{setQuantity(e.target.value)}
			}/>
			<button onClick={()=>{
				let valid=true;
				if (!quantity_state.match(/^\d+/)){
					valid=false;
					setQuantityError(true);
				} else {
					setQuantityError(false);
				}
				let parsed_price = price_state.match(/^₪?(\d+)\.(\d\d)$/);
				if (!parsed_price){
					valid=false
					setPriceError(true);
				} else {
					setPriceError(false);
				}
				if (valid){
					let new_product=new Product(
						this._id,
						name_state,
						parseInt(parsed_price!![1])*100+
							parseInt(parsed_price!![2]),
						parseInt(quantity_state)
					);
					store.dispatch(updateProductAction(new_product.toPOJO()));

				}
			}
			}>Update</button>
		</>;
	}

	
	static fromPOJO(pojs : ProductPOJO) : Product{

		return new Product(
			pojs.id,
			pojs.name,
			pojs.price,
			pojs.quantity
		);
	}
	toPOJO() : ProductPOJO{
		return {
			id : this._id,
			name: this._name,
			price : this._price,
			quantity :this._quantity
		};
	}
	get id() : number{
		return this._id;
	}
	get name() : string{
		return this._name;
	}
	/*
	PurchasePanel(){
		const purchases_of_this_product = useSelector((store :StoreData)=>purchasesSelector(store, this));
		
		return <p>
		{purchases_of_this_product.map(
			purchase => <>
			{useSelector((data:StoreData)=>selectCustomerWithId(data,purchase.customer_id))!!.createLink()} <br/>
			{new Date(purchase.date_of_purchase).toUTCString()}
			<button>Add</button>
			</>
		)}
		</p>
	}
	*/


};
export function ProductsPage() {
	const products=useSelector(productsSelector);
	return <>
		<table><tbody>{products.map(product=>product.createElement())}</tbody></table>
		<br/>
	</>;
}
export function EditProductPage(){
	const {id} = useParams();
	const product=id?useSelector((data:StoreData)=>selectProductWithId(data, Number.parseInt(id))):undefined;
	return product?product.createEditPage():"Product Not Found";
}
export function	ProductsCombobox(properties : {
	customer : Customer,
	isBuyingSetter : React.Dispatch<React.SetStateAction<boolean>>
}){
	const products=useSelector(productsSelector);
	const [productId, productIdSetter] = useState(0);
	return <>
	<select onChange={e=>productIdSetter(Number.parseInt(e.target.value))}>
		{products.map(product=><option value={product.id}>{product._name}</option>)}
	</select>
	<button onClick={()=>{
		properties.isBuyingSetter(false);
		store.dispatch(buyAction({
			product: products.find(product=>productId==product.id)!!.toPOJO(),
			customer: properties.customer.toPOJO()
		}))
	}}>Buy</button>
	</>
}