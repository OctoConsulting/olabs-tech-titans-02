"use client";

import React, { useState } from "react";
import { Order } from "./schema";

interface OrderTableProps {
  orders: Order[];
}

type SortKey = keyof Order;

const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const compareValues = (a: any, b: any) => {
    if (a === b) return 0;
    if (a == null) return sortDirection === "asc" ? -1 : 1;
    if (b == null) return sortDirection === "asc" ? 1 : -1;
    return a < b ? (sortDirection === "asc" ? -1 : 1) : (sortDirection === "asc" ? 1 : -1);
  };

  const sortedOrders = [...orders].sort((a, b) => compareValues(a[sortKey], b[sortKey]));

  if (orders.length === 0) {
    return <p>No orders to display.</p>;
  }

  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="w-full bg-gray-100 border-b">
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("id")}>
            ID {sortKey === "id" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("productName")}>
            Product Name {sortKey === "productName" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("amount")}>
            Amount {sortKey === "amount" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("discount")}>
            Discount {sortKey === "discount" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
          <th className="px-4 py-2 text-left">Address</th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("status")}>
            Status {sortKey === "status" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
          <th className="px-4 py-2 text-left cursor-pointer" onClick={() => handleSort("orderedAt")}>
            Ordered At {sortKey === "orderedAt" ? (sortDirection === "asc" ? "▲" : "▼") : "▲▼"}
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedOrders.map((order) => (
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
