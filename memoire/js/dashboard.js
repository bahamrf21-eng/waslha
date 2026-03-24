/**
 * Dashboard Module
 * Handles dashboard functionality for both merchants and delivery companies
 * 
 * Features:
 * - Role-based dashboard initialization
 * - Statistics calculation and display
 * - Order listing with status badges
 * - Real-time order updates
 */

const dashboard = {
    _deliveryRealtimeBound: false,
    /**
     * Initialize dashboard based on user role
     */
    init: async function(role) {
        const currentUser = auth.getCurrentUser();
        
        if (!currentUser) {
            window.location.replace('login.html');
            return;
        }

        if (role === 'merchant') {
            await this.initMerchantDashboard();
        } else if (role === 'delivery') {
            await this.initDeliveryDashboard();
        }
    },

    /**
     * Initialize Merchant Dashboard
     */
    initMerchantDashboard: async function() {
        await orders.loadOrders();
        const userOrders = orders.getUserOrders();
        
        // Calculate statistics
        const totalOrders = userOrders.length;
        const pendingOrders = userOrders.filter(o => o.status === 'pending').length;
        const deliveredOrders = userOrders.filter(o => o.status === 'delivered').length;
        const refusedOrders = userOrders.filter(o => o.status === 'refused').length;
        const returnedOrders = userOrders.filter(o => o.status === 'returned').length;

        // Update summary cards
        document.getElementById('totalOrders').textContent = totalOrders;
        document.getElementById('pendingOrders').textContent = pendingOrders;
        document.getElementById('deliveredOrders').textContent = deliveredOrders;

        // Update refused counter
        var refusedEl = document.getElementById('merchantRefusedOrders');
        if (refusedEl) refusedEl.textContent = refusedOrders;

        // Update returned counter
        var returnedEl = document.getElementById('merchantReturnedOrders');
        if (returnedEl) returnedEl.textContent = returnedOrders;

        // Display recent orders
        this.renderRecentOrders(userOrders.slice(0, 5));

        // Render refused orders list for merchant
        this.renderMerchantRefusedOrders(userOrders.filter(o => o.status === 'refused'));

        // Render returned orders list for merchant
        this.renderMerchantReturnedOrders(userOrders.filter(o => o.status === 'returned'));
    },

    /**
     * Initialize Delivery Company Dashboard
     */
    _phoneSearchQuery: '',

    initDeliveryDashboard: async function() {
        await this.refreshDeliveryDashboard();
        this.bindDeliveryRealtime();
        this.bindPhoneSearch();
    },

    /**
     * Bind phone search input and button on delivery dashboard
     */
    bindPhoneSearch: function() {
        var self = this;
        var searchInput = document.getElementById('phoneSearch');
        var searchBtn = document.getElementById('phoneSearchBtn');
        if (!searchInput) return;

        function doSearch() {
            self._phoneSearchQuery = searchInput.value.trim();
            self.refreshDeliveryDashboard();
        }

        // Real-time filtering as user types
        searchInput.addEventListener('input', doSearch);

        // Explicit button click
        if (searchBtn) {
            searchBtn.addEventListener('click', doSearch);
        }

        // Enter key support
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
    },

    refreshDeliveryDashboard: async function() {
        // Reload orders from Supabase to get latest data
        await orders.loadOrders();

        // Auto-return: check for in_progress orders older than 48h
        await this.checkAutoReturn();

        const allOrders = orders.getUserOrders();

        // Apply phone search filter (local filtering only)
        var phoneQuery = this._phoneSearchQuery || '';
        var filteredOrders = allOrders;
        if (phoneQuery) {
            filteredOrders = allOrders.filter(function(o) {
                return o.phone && o.phone.indexOf(phoneQuery) !== -1;
            });
        }

        // Calculate statistics (always from full list)
        const receivedOrders = allOrders.length;
        const inProgressOrders = allOrders.filter(o => o.status === 'in_progress').length;
        const completedOrders = allOrders.filter(o => o.status === 'delivered').length;
        const returnedCount = allOrders.filter(o => o.status === 'returned').length;

        // Update summary cards
        document.getElementById('receivedOrders').textContent = receivedOrders;
        document.getElementById('inProgressOrders').textContent = inProgressOrders;
        document.getElementById('completedOrders').textContent = completedOrders;

        // Update returned counter
        var returnedEl = document.getElementById('returnedOrders');
        if (returnedEl) returnedEl.textContent = returnedCount;

        // Display available orders (pending) — filtered by phone search
        const availableOrders = filteredOrders.filter(o => o.status === 'pending');
        this.renderAvailableOrders(availableOrders);

        // Display orders in progress — filtered by phone search
        const inProgressOrdersList = filteredOrders.filter(o => o.status === 'in_progress');
        this.renderInProgressOrders(inProgressOrdersList);

        // Display completed orders — filtered by phone search
        const completedOrdersList = filteredOrders.filter(o => o.status === 'delivered');
        this.renderCompletedOrders(completedOrdersList);

        // Display refused orders — filtered by phone search
        const refusedOrdersList = filteredOrders.filter(o => o.status === 'refused');
        this.renderRefusedOrders(refusedOrdersList);

        // Display returned orders — filtered by phone search
        const returnedOrdersList = filteredOrders.filter(o => o.status === 'returned');
        this.renderReturnedOrders(returnedOrdersList);

        // Update refused counter
        var refusedEl = document.getElementById('refusedOrders');
        if (refusedEl) refusedEl.textContent = allOrders.filter(o => o.status === 'refused').length;
    },

    /**
     * Auto-return: mark in_progress orders as "returned" if older than 48 hours
     */
    checkAutoReturn: async function() {
        var now = Date.now();
        var FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

        for (var i = 0; i < orders.orders.length; i++) {
            var order = orders.orders[i];
            if (order.status === 'in_progress' && order.startedAt) {
                if (now - order.startedAt >= FORTY_EIGHT_HOURS) {
                    // Update in Supabase
                    await updateOrderStatus(order.id, 'returned');
                }
            }
        }
    },

    bindDeliveryRealtime: function() {
        if (this._deliveryRealtimeBound) return;
        this._deliveryRealtimeBound = true;

        // Subscribe to Supabase real-time changes on orders table
        var self = this;
        window.supabaseDb
            .channel('orders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, function() {
                self.refreshDeliveryDashboard();
            })
            .subscribe();
    },

    /**
     * Render recent orders for merchant dashboard
     */
    renderRecentOrders: function(ordersList) {
        const container = document.getElementById('recentOrders');
        
        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No orders yet. Create your first order!</p>';
            return;
        }

        const ordersHTML = ordersList.map(order => {
            const statusBadge = orders.getStatusBadge(order.status);
            const date = new Date(order.createdAt).toLocaleDateString();
            
            return `
                <div class="order-item">
                    <div class="order-item-content">
                        <div class="order-item-title">${order.productName}</div>
                        <div class="order-item-meta">
                            <span>📍 ${order.wilaya}</span>
                            <span>⚖️ ${order.weight} kg</span>
                            <span>📅 ${date}</span>
                        </div>
                    </div>
                    <div class="order-item-actions">
                        ${statusBadge}
                        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-primary">View</a>
                        ${order.status === 'pending' ? `<button class="btn btn-sm btn-edit" onclick="orders.openEditModal(${order.id})">Edit</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="orders.deleteOrder(${order.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHTML;
    },

    /**
     * Render refused orders for merchant dashboard
     */
    renderMerchantRefusedOrders: function(ordersList) {
        var container = document.getElementById('merchantRefusedOrdersList');
        if (!container) return;

        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No refused orders</p>';
            return;
        }

        var html = ordersList.map(function(order) {
            var statusBadge = orders.getStatusBadge(order.status);
            var timelineItem = order.timeline ? order.timeline.find(function(t) { return t.status === 'refused'; }) : null;
            var refusedDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';

            return '<div class="order-item">' +
                '<div class="order-item-content">' +
                    '<div class="order-item-title">' + order.productName + '</div>' +
                    '<div class="order-item-meta">' +
                        '<span>📍 ' + order.wilaya + '</span>' +
                        '<span>⚖️ ' + order.weight + ' kg</span>' +
                        '<span>❌ Refused: ' + refusedDate + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="order-item-actions">' +
                    statusBadge +
                    '<a href="order-details.html?id=' + order.id + '" class="btn btn-sm btn-primary">View</a>' +
                    '<button class="btn btn-sm btn-danger" onclick="orders.deleteOrder(' + order.id + ')">Delete</button>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    },

    /**
     * Render returned orders for merchant dashboard
     */
    renderMerchantReturnedOrders: function(ordersList) {
        var container = document.getElementById('merchantReturnedOrdersList');
        if (!container) return;

        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No returned orders</p>';
            return;
        }

        var html = ordersList.map(function(order) {
            var statusBadge = orders.getStatusBadge(order.status);
            var timelineItem = order.timeline ? order.timeline.find(function(t) { return t.status === 'returned'; }) : null;
            var returnedDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';

            return '<div class="order-item">' +
                '<div class="order-item-content">' +
                    '<div class="order-item-title">' + order.productName + '</div>' +
                    '<div class="order-item-meta">' +
                        '<span>📍 ' + order.wilaya + '</span>' +
                        '<span>⚖️ ' + order.weight + ' kg</span>' +
                        '<span>🔄 Returned: ' + returnedDate + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="order-item-actions">' +
                    statusBadge +
                    '<a href="order-details.html?id=' + order.id + '" class="btn btn-sm btn-primary">View</a>' +
                    '<button class="btn btn-sm btn-danger" onclick="orders.deleteOrder(' + order.id + ')">Delete</button>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    },

    /**
     * Render available orders for delivery dashboard
     */
    renderAvailableOrders: function(ordersList) {
        const container = document.getElementById('availableOrders');
        
        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No available orders at the moment</p>';
            return;
        }

        const ordersHTML = ordersList.map(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            
            return `
                <div class="order-item">
                    <div class="order-item-content">
                        <div class="order-item-title">${order.productName}</div>
                        <div class="order-item-meta">
                            <span>📍 ${order.wilaya}</span>
                            <span>⚖️ ${order.weight} kg</span>
                            <span>📅 Created: ${date}</span>
                            ${order.phone ? `<span>📞 ${order.phone}</span>` : ''}
                            <span>📦 ${order.deliveryType ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1) : '-'}</span>
                        </div>
                        ${order.notes ? `<div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem; padding: 0.5rem; background-color: #f8fafc; border-radius: 4px; font-style: italic;">💬 ${order.notes}</div>` : ''}
                    </div>
                    <div class="order-item-actions">
                        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-primary">View Details</a>
                        <button class="btn btn-sm btn-success" onclick="orders.updateOrderStatus(${order.id}, 'in_progress')">
                            Accept Order
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="orders.updateOrderStatus(${order.id}, 'refused')">
                            Refuse
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHTML;
    },

    /**
     * Render in-progress orders for delivery dashboard
     */
    renderInProgressOrders: function(ordersList) {
        const container = document.getElementById('inProgressOrdersList');
        
        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No orders in progress</p>';
            return;
        }

        const ordersHTML = ordersList.map(order => {
            const timelineItem = order.timeline.find(t => t.status === 'in_progress');
            const startDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';
            
            return `
                <div class="order-item">
                    <div class="order-item-content">
                        <div class="order-item-title">${order.productName}</div>
                        <div class="order-item-meta">
                            <span>📍 ${order.wilaya}</span>
                            <span>⚖️ ${order.weight} kg</span>
                            <span>🚚 Started: ${startDate}</span>
                            ${order.phone ? `<span>📞 ${order.phone}</span>` : ''}
                            <span>📦 ${order.deliveryType ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1) : '-'}</span>
                        </div>
                    </div>
                    <div class="order-item-actions">
                        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-primary">View Details</a>
                        <button class="btn btn-sm btn-success" onclick="orders.updateOrderStatus(${order.id}, 'delivered')">
                            Mark Delivered
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHTML;
    },

    /**
     * Render completed orders for delivery dashboard
     */
    renderCompletedOrders: function(ordersList) {
        const container = document.getElementById('completedOrdersList');
        if (!container) return;

        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No completed orders yet</p>';
            return;
        }

        const ordersHTML = ordersList.map(order => {
            const timelineItem = order.timeline.find(t => t.status === 'delivered');
            const deliveredDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';

            return `
                <div class="order-item">
                    <div class="order-item-content">
                        <div class="order-item-title">${order.productName}</div>
                        <div class="order-item-meta">
                            <span>📍 ${order.wilaya}</span>
                            <span>⚖️ ${order.weight} kg</span>
                            <span>✅ Delivered: ${deliveredDate}</span>
                            <span>📦 ${order.deliveryType ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1) : '-'}</span>
                        </div>
                    </div>
                    <div class="order-item-actions">
                        ${orders.getStatusBadge(order.status)}
                        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-primary">View Details</a>
                        <button class="btn btn-sm btn-danger" onclick="orders.deleteDeliveryOrder(${order.id})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ordersHTML;
    },

    /**
     * Render refused orders for delivery dashboard
     */
    renderRefusedOrders: function(ordersList) {
        var container = document.getElementById('refusedOrdersList');
        if (!container) return;

        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No refused orders</p>';
            return;
        }

        var html = ordersList.map(function(order) {
            var timelineItem = order.timeline.find(function(t) { return t.status === 'refused'; });
            var refusedDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';

            return '<div class="order-item">' +
                '<div class="order-item-content">' +
                    '<div class="order-item-title">' + order.productName + '</div>' +
                    '<div class="order-item-meta">' +
                        '<span>📍 ' + order.wilaya + '</span>' +
                        '<span>⚖️ ' + order.weight + ' kg</span>' +
                        '<span>❌ Refused: ' + refusedDate + '</span>' +
                        '<span>📦 ' + (order.deliveryType ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1) : '-') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="order-item-actions">' +
                    orders.getStatusBadge(order.status) +
                    '<a href="order-details.html?id=' + order.id + '" class="btn btn-sm btn-primary">View Details</a>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    },

    /**
     * Render returned orders for delivery dashboard
     */
    renderReturnedOrders: function(ordersList) {
        var container = document.getElementById('returnedOrdersList');
        if (!container) return;

        if (ordersList.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">No returned orders</p>';
            return;
        }

        var html = ordersList.map(function(order) {
            var timelineItem = order.timeline.find(function(t) { return t.status === 'returned'; });
            var returnedDate = timelineItem ? new Date(timelineItem.date).toLocaleDateString() : 'N/A';

            return '<div class="order-item">' +
                '<div class="order-item-content">' +
                    '<div class="order-item-title">' + order.productName + '</div>' +
                    '<div class="order-item-meta">' +
                        '<span>📍 ' + order.wilaya + '</span>' +
                        '<span>⚖️ ' + order.weight + ' kg</span>' +
                        '<span>🔄 Returned: ' + returnedDate + '</span>' +
                        (order.phone ? '<span>📞 ' + order.phone + '</span>' : '') +
                        '<span>📦 ' + (order.deliveryType ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1) : '-') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="order-item-actions">' +
                    orders.getStatusBadge(order.status) +
                    '<a href="order-details.html?id=' + order.id + '" class="btn btn-sm btn-primary">View Details</a>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML = html;
    }
};
