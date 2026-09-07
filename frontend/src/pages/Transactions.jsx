import { useEffect, useState } from "react";

import api from "../services/api";
import Navbar from "../components/Navbar";

function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [page, setPage] = useState(0);
    const [pageSize] = useState(5);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [period, setPeriod] = useState("ALL");
    const [type, setType] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState("");

    const [sortBy, setSortBy] = useState("transactionDate");
    const [direction, setDirection] = useState("desc");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        type: "EXPENSE",
        category: "",
        amount: "",
        description: "",
        transactionDate: ""
    });

    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [formCategoryError, setFormCategoryError] = useState("");

    const fetchTransactions = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {
                page,
                size: pageSize,
                sortBy,
                direction
            };

            if (period !== "ALL") {
                params.period = period;
            }

            if (type) {
                params.type = type;
            }

            if (category) {
                params.category = category;
            }

            if (date) {
                params.date = date;
            }

            const response = await api.get("/transactions", {
                params
            });

            const data = response.data;

            /*
             * Support different possible backend response formats:
             *
             * 1. { transactions: [...] }
             * 2. { content: [...] }
             * 3. [...]
             */
            if (Array.isArray(data)) {
                setTransactions(data);
            } else if (Array.isArray(data?.transactions)) {
                setTransactions(data.transactions);
            } else if (Array.isArray(data?.content)) {
                setTransactions(data.content);
            } else {
                setTransactions([]);
            }

            setTotalPages(
                Number(data?.totalPages || 0)
            );

            setTotalElements(
                Number(data?.totalElements || 0)
            );
        } catch (err) {
            console.error("Error loading transactions:", err);

            setError("Unable to load transactions.");

            // Always keep transactions as an array
            setTransactions([]);
            setTotalPages(0);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [
        page,
        period,
        type,
        category,
        date,
        sortBy,
        direction
    ]);

    const handleChange = (e) => {
        const {
            name,
            value
        } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (name === "category") {
            if (value === "") {
                setFormCategoryError("");
                return;
            }

            const categoryPattern =
                /^[a-zA-Z]+(?: [a-zA-Z]*)*$/;

            if (!categoryPattern.test(value)) {
                setFormCategoryError(
                    "Text only. Numbers and special characters are not allowed."
                );
            } else {
                setFormCategoryError("");
            }
        }
    };

    const openAddForm = () => {
        setEditingId(null);

        setFormData({
            type: "EXPENSE",
            category: "",
            amount: "",
            description: "",
            transactionDate: ""
        });

        setFormError("");
        setFormCategoryError("");
        setShowForm(true);
    };

    const openEditForm = (transaction) => {
        setEditingId(transaction.id);

        setFormData({
            type: transaction.type || "EXPENSE",
            category: transaction.category || "",
            amount: transaction.amount || "",
            description: transaction.description || "",
            transactionDate:
                transaction.transactionDate || ""
        });

        setFormError("");
        setFormCategoryError("");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormError("");
        setFormCategoryError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError("");

        const finalCategoryPattern =
            /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;

        const trimmedCategory =
            formData.category.trim();

        if (!finalCategoryPattern.test(trimmedCategory)) {
            setFormCategoryError(
                "Text only. Numbers and special characters are not allowed."
            );
            return;
        }

        if (!formData.amount || Number(formData.amount) <= 0) {
            setFormError(
                "Amount must be greater than 0."
            );
            return;
        }

        if (!formData.transactionDate) {
            setFormError(
                "Please select a transaction date."
            );
            return;
        }

        setFormLoading(true);

        try {
            const requestData = {
                type: formData.type,

                category: trimmedCategory,

                amount: Number(formData.amount),

                description:
                    formData.description.trim(),

                transactionDate:
                    formData.transactionDate
            };

            if (editingId) {
                await api.put(
                    `/transactions/${editingId}`,
                    requestData
                );
            } else {
                await api.post(
                    "/transactions",
                    requestData
                );
            }

            closeForm();

            await fetchTransactions();
        } catch (err) {
            console.error(
                "Error saving transaction:",
                err
            );

            if (err.response?.data?.error) {
                setFormError(
                    err.response.data.error
                );
            } else if (err.response?.data?.message) {
                setFormError(
                    err.response.data.message
                );
            } else {
                setFormError(
                    "Unable to save transaction."
                );
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this transaction?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(
                `/transactions/${id}`
            );

            await fetchTransactions();
        } catch (err) {
            console.error(
                "Error deleting transaction:",
                err
            );

            setError(
                "Unable to delete transaction."
            );
        }
    };

    const clearFilters = () => {
        setPeriod("ALL");
        setType("");
        setCategory("");
        setDate("");
        setPage(0);
        setSortBy("transactionDate");
        setDirection("desc");
        setError("");
    };

    const handlePeriodChange = (e) => {
        setPeriod(e.target.value);
        setPage(0);
    };

    const handleTypeChange = (e) => {
        setType(e.target.value);
        setPage(0);
    };

    const handleCategoryFilterChange = (e) => {
        setCategory(e.target.value);
        setPage(0);
    };

    const handleDateChange = (e) => {
        setDate(e.target.value);
        setPage(0);
    };

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
        setPage(0);
    };

    const handleDirectionChange = (e) => {
        setDirection(e.target.value);
        setPage(0);
    };

    return (
        <div>
            <Navbar />

            <main className="transactions-container">

                {/* Header */}
                <div className="transactions-header">
                    <div>
                        <h1>
                            Transactions
                        </h1>

                        <p>
                            Manage your income and expenses
                        </p>
                    </div>

                    <button
                        className="add-transaction-button"
                        onClick={openAddForm}
                    >
                        + Add Transaction
                    </button>
                </div>

                {/* Filters */}
                <div className="filters-card">

                    <div className="filter-group">
                        <label>
                            Period
                        </label>

                        <select
                            value={period}
                            onChange={handlePeriodChange}
                        >
                            <option value="ALL">
                                All
                            </option>

                            <option value="WEEK">
                                This Week
                            </option>

                            <option value="MONTH">
                                This Month
                            </option>

                            <option value="YEAR">
                                This Year
                            </option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>
                            Type
                        </label>

                        <select
                            value={type}
                            onChange={handleTypeChange}
                        >
                            <option value="">
                                All Types
                            </option>

                            <option value="INCOME">
                                Income
                            </option>

                            <option value="EXPENSE">
                                Expense
                            </option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>
                            Category
                        </label>

                        <input
                            type="text"
                            placeholder="e.g. Food"
                            value={category}
                            onChange={
                                handleCategoryFilterChange
                            }
                        />
                    </div>

                    <div className="filter-group">
                        <label>
                            Date
                        </label>

                        <input
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                        />
                    </div>

                    <div className="filter-group">
                        <label>
                            Sort By
                        </label>

                        <select
                            value={sortBy}
                            onChange={handleSortChange}
                        >
                            <option value="transactionDate">
                                Date
                            </option>

                            <option value="amount">
                                Amount
                            </option>

                            <option value="category">
                                Category
                            </option>

                            <option value="type">
                                Type
                            </option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>
                            Order
                        </label>

                        <select
                            value={direction}
                            onChange={handleDirectionChange}
                        >
                            <option value="desc">
                                Descending
                            </option>

                            <option value="asc">
                                Ascending
                            </option>
                        </select>
                    </div>

                    <button
                        type="button"
                        className="clear-filter-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Transactions */}
                <div className="transactions-card">

                    {loading ? (
                        <div className="table-message">
                            Loading transactions...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="table-message">
                            <p>
                                No transactions found.
                            </p>

                            <button
                                className="add-transaction-button"
                                onClick={openAddForm}
                            >
                                Add Your First Transaction
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="table-wrapper">
                                <table>

                                    <thead>
                                        <tr>
                                            <th>
                                                Date
                                            </th>

                                            <th>
                                                Type
                                            </th>

                                            <th>
                                                Category
                                            </th>

                                            <th>
                                                Description
                                            </th>

                                            <th>
                                                Amount
                                            </th>

                                            <th>
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {transactions.map(
                                            (transaction) => (
                                                <tr
                                                    key={
                                                        transaction.id
                                                    }
                                                >
                                                    <td>
                                                        {
                                                            transaction.transactionDate
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                transaction.type ===
                                                                "INCOME"
                                                                    ? "transaction-income"
                                                                    : "transaction-expense"
                                                            }
                                                        >
                                                            {
                                                                transaction.type
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            transaction.category
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            transaction.description ||
                                                            "-"
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={
                                                                transaction.type ===
                                                                "INCOME"
                                                                    ? "income-text"
                                                                    : "expense-text"
                                                            }
                                                        >
                                                            {
                                                                transaction.type ===
                                                                "INCOME"
                                                                    ? "+"
                                                                    : "-"
                                                            }

                                                            ₹
                                                            {Number(
                                                                transaction.amount || 0
                                                            ).toFixed(2)}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="action-buttons">

                                                            <button
                                                                className="edit-button"
                                                                onClick={() =>
                                                                    openEditForm(
                                                                        transaction
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        transaction.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>

                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>

                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pagination">

                                <span>
                                    Total: {totalElements}
                                </span>

                                <div>

                                    <button
                                        disabled={
                                            page === 0
                                        }
                                        onClick={() =>
                                            setPage(
                                                page - 1
                                            )
                                        }
                                    >
                                        Previous
                                    </button>

                                    <span className="page-number">
                                        Page {page + 1} of{" "}
                                        {totalPages}
                                    </span>

                                    <button
                                        disabled={
                                            totalPages === 0 ||
                                            page >=
                                                totalPages - 1
                                        }
                                        onClick={() =>
                                            setPage(
                                                page + 1
                                            )
                                        }
                                    >
                                        Next
                                    </button>

                                </div>

                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay">

                    <div className="transaction-modal">

                        <div className="modal-header">

                            <h2>
                                {editingId
                                    ? "Edit Transaction"
                                    : "Add Transaction"}
                            </h2>

                            <button
                                className="close-button"
                                onClick={closeForm}
                                type="button"
                            >
                                ×
                            </button>

                        </div>

                        {formError && (
                            <div className="error-message">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* Type */}
                            <div className="form-group">
                                <label>
                                    Type
                                </label>

                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="EXPENSE">
                                        Expense
                                    </option>

                                    <option value="INCOME">
                                        Income
                                    </option>
                                </select>
                            </div>

                            {/* Category */}
                            <div className="form-group">

                                <label>
                                    Category
                                </label>

                                <input
                                    type="text"
                                    name="category"
                                    placeholder="e.g. Food, Salary, Travel"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                />

                                {formCategoryError && (
                                    <span
                                        style={{
                                            display: "block",
                                            color: "#dc2626",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            marginTop: "6px",
                                            lineHeight: "1.4"
                                        }}
                                    >
                                        {formCategoryError}
                                    </span>
                                )}
                            </div>

                            {/* Amount */}
                            <div className="form-group">

                                <label>
                                    Amount
                                </label>

                                <input
                                    type="number"
                                    name="amount"
                                    placeholder="Enter amount"
                                    min="0.01"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* Description */}
                            <div className="form-group">

                                <label>
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    placeholder="Enter description"
                                    value={
                                        formData.description
                                    }
                                    onChange={handleChange}
                                    rows="3"
                                />

                            </div>

                            {/* Date */}
                            <div className="form-group">

                                <label>
                                    Transaction Date
                                </label>

                                <input
                                    type="date"
                                    name="transactionDate"
                                    value={
                                        formData.transactionDate
                                    }
                                    onChange={handleChange}
                                    required
                                />

                            </div>

                            {/* Buttons */}
                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="cancel-button"
                                    onClick={closeForm}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="auth-button"
                                    disabled={formLoading}
                                >
                                    {formLoading
                                        ? "Saving..."
                                        : editingId
                                            ? "Update"
                                            : "Add Transaction"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>
            )}
        </div>
    );
}

export default Transactions;