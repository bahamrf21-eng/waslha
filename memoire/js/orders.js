/**
 * Orders Module
 * Handles order creation, listing, details, and status updates
 * 
 * Features:
 * - Order creation with validation
 * - Role-based order access control
 * - Status updates with timeline tracking
 * - Order details with role-based actions
 * - Supabase persistence (replaces localStorage)
 */

const orders = {
    /**
     * Delivery companies – loaded from Supabase on init.
     */
    deliveryCompanies: [],

    // Orders loaded from Supabase
    orders: [],

    /**
     * Create a new order. Merchant must select a delivery company.
     */
    createOrder: async function () {
        const currentUser = auth.getCurrentUser();

        if (!currentUser || currentUser.role !== 'merchant') {
            this.showError('Only merchants can create orders');
            return;
        }

        // Get form values (including delivery company and customer phone)
        const productName = document.getElementById('productName').value.trim();
        const wilaya = document.getElementById('wilaya').value;
        const weight = parseFloat(document.getElementById('weight').value);
        const notes = document.getElementById('notes').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const deliveryCompanySelect = document.getElementById('deliveryCompany');
        const selectedValue = deliveryCompanySelect ? deliveryCompanySelect.value.trim() : '';
        const selectedText = deliveryCompanySelect && deliveryCompanySelect.selectedIndex >= 0
            ? deliveryCompanySelect.options[deliveryCompanySelect.selectedIndex].text.trim()
            : '';
        const deliveryCompany = selectedValue || selectedText;
        const deliveryTypeEl = document.getElementById('deliveryType');
        const deliveryType = deliveryTypeEl ? deliveryTypeEl.value : '';
        const firstName = document.getElementById('firstName') ? document.getElementById('firstName').value.trim() : '';
        const lastName = document.getElementById('lastName') ? document.getElementById('lastName').value.trim() : '';
        const customerAddress = document.getElementById('customerAddress') ? document.getElementById('customerAddress').value.trim() : '';

        // Validation
        if (!firstName) {
            this.showError('Customer first name is required');
            document.getElementById('firstName').focus();
            return;
        }

        if (!/^[a-zA-ZÀ-ÿ\s'-]{2,}$/.test(firstName)) {
            this.showError('Please enter a valid first name (letters only, min 2 characters)');
            document.getElementById('firstName').focus();
            return;
        }

        if (!lastName) {
            this.showError('Customer last name is required');
            document.getElementById('lastName').focus();
            return;
        }

        if (!/^[a-zA-ZÀ-ÿ\s'-]{2,}$/.test(lastName)) {
            this.showError('Please enter a valid last name (letters only, min 2 characters)');
            document.getElementById('lastName').focus();
            return;
        }

        if (!customerAddress || customerAddress.length < 5) {
            this.showError('Customer address is required (min 5 characters)');
            if (document.getElementById('customerAddress')) document.getElementById('customerAddress').focus();
            return;
        }

        if (!productName) {
            this.showError('Product name is required');
            document.getElementById('productName').focus();
            return;
        }

        if (!deliveryCompany) {
            this.showError('Please select a delivery company');
            if (deliveryCompanySelect) deliveryCompanySelect.focus();
            return;
        }

        if (!wilaya) {
            this.showError('Please select a wilaya');
            document.getElementById('wilaya').focus();
            return;
        }

        if (!weight || weight <= 0) {
            this.showError('Please enter a valid weight (greater than 0)');
            document.getElementById('weight').focus();
            return;
        }

        if (!customerPhone) {
            this.showError('Customer phone number is required');
            document.getElementById('customerPhone').focus();
            return;
        }

        if (!/^\d+$/.test(customerPhone)) {
            this.showError('Phone number must contain only digits');
            document.getElementById('customerPhone').focus();
            return;
        }

        if (!deliveryType) {
            this.showError('Please select a delivery type');
            if (deliveryTypeEl) deliveryTypeEl.focus();
            return;
        }

        // Create new order (including selected delivery company)
        const newOrder = {
            merchantId: currentUser.id,
            firstName: firstName,
            lastName: lastName,
            customerAddress: customerAddress,
            productName: productName,
            product: productName,
            wilaya: wilaya,
            weight: weight,
            notes: notes || '',
            phone: customerPhone,
            status: 'pending',
            deliveryCompany: deliveryCompany,
            deliveryType: deliveryType,
            createdAt: new Date().toISOString(),
            timeline: [
                { status: 'pending', date: new Date().toISOString() }
            ]
        };

        // Save to Supabase
        const saved = await saveOrder(newOrder);
        if (!saved) {
            this.showError('Failed to create order. Please try again.');
            return;
        }

        // Show success message
        this.showSuccess('Order created successfully! Redirecting...');

        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'orders-list.html';
        }, 1000);
    },

    /**
     * Load orders list for merchant
     * @param {string} [phoneFilter] - Optional phone search string
     */
    loadOrdersList: async function (phoneFilter) {
        const currentUser = auth.getCurrentUser();

        if (!currentUser) {
            window.location.replace('login.html');
            return;
        }

        // Load orders from Supabase
        await this.loadOrders();

        // Filter orders by role
        let userOrders = [];
        if (currentUser.role === 'merchant') {
            userOrders = this.orders.filter(o => o.merchantId === currentUser.id);
        } else if (currentUser.role === 'delivery') {
            userOrders = this.orders.filter(o => o.deliveryCompany === currentUser.deliveryCompany);
        }

        // Apply phone search filter (local filtering only)
        if (phoneFilter) {
            userOrders = userOrders.filter(function (o) {
                return o.phone && o.phone.includes(phoneFilter);
            });
        }

        const tbody = document.getElementById('ordersTableBody');

        if (userOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = userOrders.map(order => {
            const statusBadge = this.getStatusBadge(order.status);
            var typeLabel = order.deliveryType ? (order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)) : '-';
            var customerName = ((order.firstName || '') + ' ' + (order.lastName || '')).trim() || '-';
            return `
                <tr>
                    <td>#${order.id}</td>
                    <td>${customerName}</td>
                    <td>${order.productName}</td>
                    <td>${order.wilaya}</td>
                    <td>${order.weight} kg</td>
                    <td>${typeLabel}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <a href="order-details.html?id=${order.id}" class="btn btn-sm btn-primary">View Details</a>
                        ${order.status === 'pending' ? `<button class="btn btn-sm btn-edit" onclick="orders.openEditModal(${order.id})">Edit</button>` : ''}
                        <button class="btn btn-sm btn-danger" onclick="orders.deleteOrder(${order.id})">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Load order details page
     */
    loadOrderDetails: async function () {
        const currentUser = auth.getCurrentUser();

        if (!currentUser) {
            window.location.replace('login.html');
            return;
        }

        // Get order ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = parseInt(urlParams.get('id'));

        if (!orderId) {
            this.showError('Order ID not found');
            setTimeout(() => {
                window.location.href = currentUser.role === 'merchant' ? 'orders-list.html' : 'delivery-dashboard.html';
            }, 1500);
            return;
        }

        // Load orders from Supabase
        await this.loadOrders();

        // Find order
        const order = this.orders.find(o => o.id === orderId);

        if (!order) {
            this.showError('Order not found');
            setTimeout(() => {
                window.location.href = currentUser.role === 'merchant' ? 'orders-list.html' : 'delivery-dashboard.html';
            }, 1500);
            return;
        }

        // Check permissions: merchant can only see own orders; delivery only orders assigned to their company
        if (currentUser.role === 'merchant' && order.merchantId !== currentUser.id) {
            this.showError('You do not have permission to view this order');
            setTimeout(() => {
                window.location.href = 'orders-list.html';
            }, 1500);
            return;
        }
        if (currentUser.role === 'delivery') {
            var companyName = currentUser.deliveryCompany;
            if (!companyName || order.deliveryCompany !== companyName) {
                this.showError('This order is not assigned to your company');
                setTimeout(() => {
                    window.location.href = 'delivery-dashboard.html';
                }, 1500);
                return;
            }
        }

        // Update navigation links
        if (currentUser.role === 'merchant') {
            document.getElementById('dashboardLink').href = 'merchant-dashboard.html';
            document.getElementById('ordersLink').href = 'orders-list.html';
            document.getElementById('backButton').href = 'orders-list.html';
        } else {
            document.getElementById('dashboardLink').href = 'delivery-dashboard.html';
            document.getElementById('ordersLink').style.display = 'none';
            document.getElementById('backButton').href = 'delivery-dashboard.html';
        }

        // Display order information
        document.getElementById('orderIdSubtitle').textContent = `Order #${order.id}`;
        document.getElementById('orderProduct').textContent = order.productName || order.product || '-';

        document.getElementById('orderWilaya').textContent = order.wilaya;
        document.getElementById('orderWeight').textContent = `${order.weight} kg`;
        document.getElementById('orderStatusBadge').innerHTML = this.getStatusBadge(order.status);
        document.getElementById('orderDeliveryCompany').textContent = order.deliveryCompany || 'Not assigned';

        // Display delivery type
        var orderTypeEl = document.getElementById('orderDeliveryType');
        if (orderTypeEl) {
            orderTypeEl.textContent = order.deliveryType
                ? order.deliveryType.charAt(0).toUpperCase() + order.deliveryType.slice(1)
                : '-';
        }
        // Display customer name
        var orderFirstNameEl = document.getElementById('orderFirstName');
        if (orderFirstNameEl) orderFirstNameEl.textContent = order.firstName || '-';
        var orderLastNameEl = document.getElementById('orderLastName');
        if (orderLastNameEl) orderLastNameEl.textContent = order.lastName || '-';
        var orderCustomerAddressEl = document.getElementById('orderCustomerAddress');
        if (orderCustomerAddressEl) orderCustomerAddressEl.textContent = order.customerAddress || '-';

        var orderPhoneEl = document.getElementById('orderPhone');
        if (orderPhoneEl) orderPhoneEl.textContent = order.phone || 'N/A';
        document.getElementById('orderNotes').textContent = order.notes || 'No notes provided';

        // Display delivery note if present
        var deliveryNoteContainer = document.getElementById('deliveryNoteDisplay');
        if (!deliveryNoteContainer) {
            var cardBody = document.getElementById('orderNotes');
            while (cardBody && !cardBody.classList.contains('card-body')) {
                cardBody = cardBody.parentElement;
            }
            if (cardBody) {
                var dnDiv = document.createElement('div');
                dnDiv.id = 'deliveryNoteDisplay';
                dnDiv.style.cssText = 'padding-top: 1.5rem; margin-top: 1rem; border-top: 1px solid var(--border-color);';
                dnDiv.innerHTML = '<p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 500;">📝 Delivery Note</p>' +
                    '<p style="color: var(--text-primary); line-height: 1.6;" id="orderDeliveryNote">No delivery note</p>';
                cardBody.appendChild(dnDiv);
            }
        }
        var deliveryNoteEl = document.getElementById('orderDeliveryNote');
        if (deliveryNoteEl) {
            deliveryNoteEl.textContent = order.deliveryNote || 'No delivery note';
        }

        // Display timeline
        this.renderTimeline(order);

        // Display action buttons based on role
        this.renderActionButtons(order, currentUser);

        // Scroll to top on load
        window.scrollTo(0, 0);
    },

    /**
     * Render order timeline
     */
    renderTimeline: function (order) {
        const timelineEl = document.getElementById('orderTimeline');
        // Build timeline steps; if order was refused, show that instead of the normal flow
        var statuses;
        if (order.status === 'refused') {
            statuses = [
                { key: 'pending', label: 'Order Created', icon: '📦' },
                { key: 'refused', label: 'Refused', icon: '❌' }
            ];
        } else if (order.status === 'returned') {
            statuses = [
                { key: 'pending', label: 'Order Created', icon: '📦' },
                { key: 'in_progress', label: 'In Progress', icon: '🚚' },
                { key: 'returned', label: 'Returned (48h)', icon: '↩️' }
            ];
        } else {
            statuses = [
                { key: 'pending', label: 'Order Created', icon: '📦' },
                { key: 'in_progress', label: 'In Progress', icon: '🚚' },
                { key: 'delivered', label: 'Delivered', icon: '✅' }
            ];
        }

        // Build summary header card above timeline
        var customerName = ((order.firstName || '') + ' ' + (order.lastName || '')).trim() || 'N/A';
        var summaryHTML = '<div class="timeline-summary-card">' +
            '<div class="timeline-summary-row">' +
            '<span class="timeline-summary-label">Order</span>' +
            '<span class="timeline-summary-value">#' + order.id + '</span>' +
            '</div>' +
            '<div class="timeline-summary-row">' +
            '<span class="timeline-summary-label">Customer</span>' +
            '<span class="timeline-summary-value">' + customerName + '</span>' +
            '</div>' +
            '<div class="timeline-summary-row">' +
            '<span class="timeline-summary-label">Phone</span>' +
            '<span class="timeline-summary-value">' + (order.phone || 'N/A') + '</span>' +
            '</div>' +
            '<div class="timeline-summary-row">' +
            '<span class="timeline-summary-label">Wilaya</span>' +
            '<span class="timeline-summary-value">' + (order.wilaya || 'N/A') + '</span>' +
            '</div>' +
            '<div class="timeline-summary-row">' +
            '<span class="timeline-summary-label">Status</span>' +
            '<span class="timeline-summary-value">' + this.getStatusBadge(order.status) + '</span>' +
            '</div>' +
            '</div>';

        const timelineHTML = statuses.map((status, index) => {
            const timelineItem = order.timeline.find(t => t.status === status.key);
            const isActive = order.status === status.key;
            const isCompleted = this.getStatusOrder(order.status) > index;
            const isPending = this.getStatusOrder(order.status) < index;

            let className = 'timeline-item';
            if (isCompleted) className += ' completed';
            if (isActive) className += ' active';

            const date = timelineItem
                ? new Date(timelineItem.date).toLocaleString()
                : (isPending ? 'Pending' : '');

            return `
                <div class="${className}" style="animation-delay: ${index * 0.12}s">
                    <span class="timeline-icon">${status.icon}</span>
                    <div class="timeline-content">
                        <div class="timeline-title">${status.label}</div>
                        ${date ? `<div class="timeline-date">${date}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        timelineEl.innerHTML = summaryHTML + timelineHTML;
    },

    /**
     * Render action buttons based on user role
     */
    renderActionButtons: function (order, currentUser) {
        const actionButtonsEl = document.getElementById('actionButtons');

        if (currentUser.role === 'merchant') {
            actionButtonsEl.style.display = 'block';
            var merchantHTML = '<div class="d-flex gap-2" style="flex-wrap: wrap;">';
            if (order.status === 'pending') {
                merchantHTML += '<button class="btn btn-primary" onclick="orders.openEditModal(' + order.id + ')">✏️ Edit Order</button>';
            }
            merchantHTML += '<button class="btn btn-danger" onclick="orders.deleteOrder(' + order.id + ')">🗑️ Delete Order</button>';
            merchantHTML += '</div>';
            actionButtonsEl.innerHTML = merchantHTML;
        } else if (currentUser.role === 'delivery') {
            // Delivery companies can update status
            actionButtonsEl.style.display = 'block';

            let buttonsHTML = '<div class="d-flex gap-2" style="flex-wrap: wrap;">';

            if (order.status === 'delivered') {
                buttonsHTML += '<button class="btn btn-danger" onclick="orders.deleteDeliveryOrder(' + order.id + ')">🗑️ Delete Order</button>';
            }

            if (order.status === 'pending') {
                buttonsHTML += `
                    <button class="btn btn-success" onclick="orders.updateOrderStatus(${order.id}, 'in_progress')">
                        Accept Order
                    </button>
                    <button class="btn btn-outline-danger" onclick="orders.updateOrderStatus(${order.id}, 'refused')">
                        Refuse Order
                    </button>
                `;
            } else if (order.status === 'in_progress') {
                buttonsHTML += `
                    <button class="btn btn-success" onclick="orders.updateOrderStatus(${order.id}, 'delivered')">
                        Mark as Delivered
                    </button>
                `;
            } else if (order.status === 'refused') {
                buttonsHTML += '<p style="color: var(--danger-color); padding: 1rem; background-color: var(--surface); border-radius: 6px; border: 1px solid var(--border-color);">✕ Order refused</p>';
            } else if (order.status === 'returned') {
                buttonsHTML += '<p style="color: var(--warning-color); padding: 1rem; background-color: var(--surface); border-radius: 6px; border: 1px solid var(--border-color);">🔄 Order returned (48h expired)</p>';
            } else {
                buttonsHTML += '<p style="color: var(--text-secondary); padding: 1rem; background-color: var(--surface); border-radius: 6px; border: 1px solid var(--border-color);">✓ Order completed</p>';
            }

            buttonsHTML += '</div>';

            // Delivery note section
            buttonsHTML += '<div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: 8px;">' +
                '<label style="font-weight: 600; margin-bottom: 0.5rem; display: block; color: var(--text-primary);">📝 Delivery Note</label>' +
                '<textarea id="deliveryNoteInput" class="form-textarea" placeholder="Add a note about this delivery..." style="margin-bottom: 0.75rem;">' + (order.deliveryNote || '') + '</textarea>' +
                '<button class="btn btn-sm btn-primary" onclick="orders.saveDeliveryNote(' + order.id + ')">Save Note</button>' +
                '</div>';

            actionButtonsEl.innerHTML = buttonsHTML;
        }
    },

    /**
     * Update order status
     */
    updateOrderStatus: async function (orderId, newStatus) {
        const currentUser = auth.getCurrentUser();

        if (!currentUser || currentUser.role !== 'delivery') {
            this.showError('Only delivery companies can update order status');
            return;
        }

        const order = this.orders.find(o => o.id === orderId);

        if (!order) {
            this.showError('Order not found');
            return;
        }

        if (order.deliveryCompany !== currentUser.deliveryCompany) {
            this.showError('This order is not assigned to your company');
            return;
        }

        // Validate status transition
        const validTransitions = {
            'pending': ['in_progress', 'refused'],
            'in_progress': ['delivered', 'returned'],
            'delivered': [],
            'refused': [],
            'returned': []
        };

        if (!validTransitions[order.status] || !validTransitions[order.status].includes(newStatus)) {
            this.showError(`Cannot change status from ${order.status} to ${newStatus}`);
            return;
        }

        // Update status in Supabase
        const success = await updateOrderStatus(orderId, newStatus);
        if (!success) {
            this.showError('Failed to update order status. Please try again.');
            return;
        }

        // Show success message
        const statusText = newStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        this.showSuccess(`Order status updated to ${statusText}`);

        // Reload page after short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge: function (status) {
        const badges = {
            'pending': '<span class="badge badge-pending">Pending</span>',
            'in_progress': '<span class="badge badge-in_progress">In Progress</span>',
            'delivered': '<span class="badge badge-delivered">Delivered</span>',
            'cancelled': '<span class="badge badge-cancelled">Cancelled</span>',
            'refused': '<span class="badge badge-refused">Refused</span>',
            'returned': '<span class="badge badge-returned">Returned</span>'
        };
        return badges[status] || '<span class="badge">Unknown</span>';
    },

    /**
     * Get status order for timeline
     */
    getStatusOrder: function (status) {
        const order = {
            'pending': 0,
            'in_progress': 1,
            'delivered': 2,
            'refused': 1,
            'returned': 2
        };
        return order[status] !== undefined ? order[status] : 0;
    },

    /**
     * Get orders for current user
     */
    /**
     * Get orders for the current user.
     * Merchant: orders they created (merchantId match).
     * Delivery: only orders assigned to their company (deliveryCompany match).
     */
    getUserOrders: function () {
        const currentUser = auth.getCurrentUser();
        if (!currentUser) return [];

        if (currentUser.role === 'merchant') {
            return this.orders.filter(o => o.merchantId === currentUser.id);
        }
        if (currentUser.role === 'delivery' && currentUser.deliveryCompany) {
            return this.orders.filter(o => o.deliveryCompany === currentUser.deliveryCompany);
        }
        return [];
    },

    /**
     * Delete an order (merchant only).
     */
    deleteOrder: async function (orderId) {
        const currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'merchant') {
            this.showError('Only merchants can delete orders');
            return;
        }

        var order = this.orders.find(function (o) { return o.id === orderId; });
        if (!order) {
            this.showError('Order not found');
            return;
        }

        if (order.merchantId !== currentUser.id) {
            this.showError('You can only delete your own orders');
            return;
        }

        if (!confirm('Are you sure you want to delete this order?')) return;

        const success = await deleteOrder(orderId);
        if (!success) {
            this.showError('Failed to delete order. Please try again.');
            return;
        }
        this.showSuccess('Order deleted successfully');

        setTimeout(function () { window.location.reload(); }, 800);
    },

    /**
     * Delete a delivered order (delivery role only).
     */
    deleteDeliveryOrder: async function (orderId) {
        var currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'delivery') {
            this.showError('Only delivery companies can delete delivered orders');
            return;
        }

        var order = this.orders.find(function (o) { return o.id === orderId; });
        if (!order) {
            this.showError('Order not found');
            return;
        }

        if (order.deliveryCompany !== currentUser.deliveryCompany) {
            this.showError('This order is not assigned to your company');
            return;
        }

        if (order.status !== 'delivered') {
            this.showError('Only delivered orders can be deleted');
            return;
        }

        if (!confirm('Are you sure you want to delete this delivered order?')) return;

        const success = await deleteOrder(orderId);
        if (!success) {
            this.showError('Failed to delete order. Please try again.');
            return;
        }
        this.showSuccess('Delivered order deleted successfully');

        setTimeout(function () { window.location.reload(); }, 800);
    },

    /**
     * Open edit modal for a pending order (merchant only)
     */
    openEditModal: async function (orderId) {
        var currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'merchant') {
            this.showError('Only merchants can edit orders');
            return;
        }

        await this.loadOrders();
        var order = this.orders.find(function (o) { return o.id === orderId; });

        if (!order) {
            this.showError('Order not found');
            return;
        }

        if (order.status !== 'pending') {
            this.showError('Only pending orders can be edited');
            return;
        }

        if (order.merchantId !== currentUser.id) {
            this.showError('You can only edit your own orders');
            return;
        }

        // Remove existing modal if any
        var existing = document.getElementById('editOrderModal');
        if (existing) existing.remove();

        // Create modal
        var modal = document.createElement('div');
        modal.id = 'editOrderModal';
        modal.className = 'modal-overlay';
        modal.innerHTML =
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h2 class="modal-title">Edit Order #' + order.id + '</h2>' +
            '<button class="modal-close" onclick="orders.closeEditModal()">&times;</button>' +
            '</div>' +
            '<form id="editOrderForm" onsubmit="event.preventDefault(); orders.saveEditOrder();">' +
            '<input type="hidden" id="editOrderId" value="' + order.id + '">' +
            '<div class="form-group">' +
            '<label for="editFirstName" class="form-label">Customer First Name <span style="color: var(--danger-color);">*</span></label>' +
            '<input type="text" id="editFirstName" class="form-input" required minlength="2">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editLastName" class="form-label">Customer Last Name <span style="color: var(--danger-color);">*</span></label>' +
            '<input type="text" id="editLastName" class="form-input" required minlength="2">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editCustomerAddress" class="form-label">Customer Address <span style="color: var(--danger-color);">*</span></label>' +
            '<input type="text" id="editCustomerAddress" class="form-input" required minlength="5">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editProductName" class="form-label">Product Name <span style="color: var(--danger-color);">*</span></label>' +
            '<input type="text" id="editProductName" class="form-input" required minlength="2">' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editDeliveryCompany" class="form-label">Delivery Company <span style="color: var(--danger-color);">*</span></label>' +
            '<select id="editDeliveryCompany" class="form-select" required>' +
            '<option value="">Select a delivery company</option>' +
            '<option value="Express Livraison">Express Livraison</option>' +
            '<option value="Rapid Delivery">Rapid Delivery</option>' +
            '<option value="Alger Post">Alger Post</option>' +
            '<option value="Nord Express">Nord Express</option>' +
            '<option value="Sahara Logistique">Sahara Logistique</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editWilaya" class="form-label">Wilaya <span style="color: var(--danger-color);">*</span></label>' +
            '<select id="editWilaya" class="form-select" required>' +
            '<option value="">Select Wilaya</option>' +
            '<option value="Algiers">Algiers</option>' +
            '<option value="Oran">Oran</option>' +
            '<option value="Constantine">Constantine</option>' +
            '<option value="Annaba">Annaba</option>' +
            '<option value="Blida">Blida</option>' +
            '<option value="Setif">Setif</option>' +
            '<option value="Tlemcen">Tlemcen</option>' +
            '<option value="Bejaia">Bejaia</option>' +
            '<option value="Batna">Batna</option>' +
            '<option value="Djelfa">Djelfa</option>' +
            '</select>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editWeight" class="form-label">Weight (kg) <span style="color: var(--danger-color);">*</span></label>' +
            '<input type="number" id="editWeight" class="form-input" step="0.1" min="0.1" required>' +
            '</div>' +
            '<div class="form-group">' +
            '<label for="editDeliveryType" class="form-label">Delivery Type <span style="color: var(--danger-color);">*</span></label>' +
            '<select id="editDeliveryType" class="form-select" required>' +
            '<option value="">Select delivery type</option>' +
            '<option value="domicile">Domicile</option>' +
            '<option value="bureau">Bureau</option>' +
            '</select>' +
            '</div>' +
            '<div class="d-flex gap-2">' +
            '<button type="submit" class="btn btn-primary">Save Changes</button>' +
            '<button type="button" class="btn btn-secondary" onclick="orders.closeEditModal()">Cancel</button>' +
            '</div>' +
            '</form>' +
            '</div>';

        document.body.appendChild(modal);

        // Populate form fields with current values
        document.getElementById('editFirstName').value = order.firstName || '';
        document.getElementById('editLastName').value = order.lastName || '';
        document.getElementById('editCustomerAddress').value = order.customerAddress || '';
        document.getElementById('editProductName').value = order.productName || order.product || '';
        document.getElementById('editDeliveryCompany').value = order.deliveryCompany || '';
        document.getElementById('editWilaya').value = order.wilaya || '';
        document.getElementById('editWeight').value = order.weight || '';

        // Set delivery type
        var editDTSelect = document.getElementById('editDeliveryType');
        if (editDTSelect) {
            editDTSelect.value = order.deliveryType || '';
        }

        // Close modal when clicking overlay background
        modal.addEventListener('click', function (e) {
            if (e.target === modal) orders.closeEditModal();
        });
    },

    /**
     * Close edit modal
     */
    closeEditModal: function () {
        var modal = document.getElementById('editOrderModal');
        if (modal) modal.remove();
    },

    /**
     * Save edited order to Supabase
     */
    saveEditOrder: async function () {
        var orderId = parseInt(document.getElementById('editOrderId').value);
        var productName = document.getElementById('editProductName').value.trim();
        var deliveryCompany = document.getElementById('editDeliveryCompany').value;
        var wilaya = document.getElementById('editWilaya').value;
        var weight = parseFloat(document.getElementById('editWeight').value);
        var editFirstName = document.getElementById('editFirstName').value.trim();
        var editLastName = document.getElementById('editLastName').value.trim();
        var editCustomerAddress = document.getElementById('editCustomerAddress').value.trim();
        var editDeliveryType = document.getElementById('editDeliveryType').value;

        // Validation
        if (!editFirstName || !/^[a-zA-ZÀ-ÿ\s'-]{2,}$/.test(editFirstName)) {
            this.showError('Please enter a valid first name (letters only, min 2 characters)');
            return;
        }
        if (!editLastName || !/^[a-zA-ZÀ-ÿ\s'-]{2,}$/.test(editLastName)) {
            this.showError('Please enter a valid last name (letters only, min 2 characters)');
            return;
        }
        if (!editCustomerAddress || editCustomerAddress.length < 5) {
            this.showError('Customer address is required (min 5 characters)');
            return;
        }
        if (!productName || productName.length < 2) {
            this.showError('Product name must be at least 2 characters');
            return;
        }
        if (!deliveryCompany) {
            this.showError('Please select a delivery company');
            return;
        }
        if (!wilaya) {
            this.showError('Please select a wilaya');
            return;
        }
        if (!weight || weight <= 0) {
            this.showError('Please enter a valid weight');
            return;
        }

        if (!editDeliveryType) {
            this.showError('Please select a delivery type');
            return;
        }

        // Find order in local cache to check status
        var order = this.orders.find(function (o) { return o.id === orderId; });

        if (!order) {
            this.showError('Order not found');
            return;
        }

        if (order.status !== 'pending') {
            this.showError('Only pending orders can be edited');
            return;
        }

        // Update in Supabase
        const success = await updateOrder(orderId, {
            first_name: editFirstName,
            last_name: editLastName,
            customer_address: editCustomerAddress,
            product_name: productName,
            delivery_company: deliveryCompany,
            wilaya: wilaya,
            weight: weight,
            delivery_type: editDeliveryType
        });

        if (!success) {
            this.showError('Failed to update order. Please try again.');
            return;
        }

        this.closeEditModal();
        this.showSuccess('Order updated successfully!');

        // Refresh page
        setTimeout(function () { window.location.reload(); }, 800);
    },

    /**
     * Save delivery note (delivery role only)
     */
    saveDeliveryNote: async function (orderId) {
        var currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'delivery') {
            this.showError('Only delivery companies can add notes');
            return;
        }

        var noteEl = document.getElementById('deliveryNoteInput');
        if (!noteEl) return;

        var note = noteEl.value.trim();

        var order = this.orders.find(function (o) { return o.id === orderId; });

        if (!order) {
            this.showError('Order not found');
            return;
        }

        const success = await updateOrder(orderId, { delivery_note: note });
        if (!success) {
            this.showError('Failed to save delivery note. Please try again.');
            return;
        }
        this.showSuccess('Delivery note saved successfully!');
    },

    /**
     * Save orders – no-op, Supabase writes are done per-operation.
     * Kept for backward compatibility with dashboard.checkAutoReturn().
     */
    saveOrders: function () {
        // No-op: individual Supabase writes handle persistence
    },

    /**
     * Load orders from Supabase
     */
    loadOrders: async function () {
        this.orders = await getOrders();
    },

    /**
     * Show error message
     */
    showError: function (message) {
        // Remove existing messages
        const existingMessage = document.querySelector('.error-message, .success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create error message element
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;

        // Insert error message
        const container = document.querySelector('.container, .form-container');
        if (container) {
            const pageContent = container.querySelector('.page-content') || container;
            pageContent.insertBefore(errorEl, pageContent.firstChild);
        } else {
            // Fallback to alert
            alert(message);
        }
    },

    /**
     * Show success message
     */
    showSuccess: function (message) {
        // Remove existing messages
        const existingMessage = document.querySelector('.success-message, .error-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create success message element
        const successEl = document.createElement('div');
        successEl.className = 'success-message';
        successEl.textContent = message;

        // Insert success message
        const container = document.querySelector('.container, .form-container');
        if (container) {
            const pageContent = container.querySelector('.page-content') || container;
            pageContent.insertBefore(successEl, pageContent.firstChild);
        }
    }
};

// Initialize: Load orders from Supabase on page load
document.addEventListener('DOMContentLoaded', async function () {
    await orders.loadOrders();
});
