import React from "react";
import { Order } from "./schema";

interface OrderTableProps {
  orders: Order[];
}

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  if (orders.length === 0) {
    return <p>No orders to display.</p>;
  }

  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="w-full bg-gray-100 border-b">
          <th className="px-4 py-2 text-left">ID</th>
          <th className="px-4 py-2 text-left">Product Name</th>
          <th className="px-4 py-2 text-left">Amount</th>
          <th className="px-4 py-2 text-left">Discount</th>
          <th className="px-4 py-2 text-left">Address</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Ordered At</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} className="border-b">
            <td className="px-4 py-2">{order.id}</td>
            <td className="px-4 py-2">{order.productName}</td>
            <td className="px-4 py-2">${order.amount.toFixed(2)}</td>
            <td className="px-4 py-2">{order.discount ? `${order.discount}%` : "N/A"}</td>
            <td className="px-4 py-2">{`${order.address.street}, ${order.address.city}, ${order.address.state} ${order.address.zip}`}</td>
            <td className="px-4 py-2 capitalize">{order.status}</td>
            <td className="px-4 py-2">{new Date(order.orderedAt).toLocaleDateString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default OrderTable;
