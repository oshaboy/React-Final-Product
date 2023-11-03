import { Link } from 'react-router-dom';
export function MenuPage() {
	return <>
		<Link to="/products">Products</Link><br/>
		<Link to="/customers">Customers</Link><br/>
		<Link to="/purchases">Purchases</Link><br/>
	</>;
}
