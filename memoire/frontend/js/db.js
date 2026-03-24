/**
 * Database Abstraction Layer (db.js)
 * All Supabase data operations for profiles, orders, delivery companies, and timelines.
 * Depends on `supabaseDb` global created in supabaseClient.js.
 */

// Local alias – supabaseDb is set on window by supabaseClient.js
var supabase = window.supabaseDb;

/* ======================================================
   ORDERS helpers
   ====================================================== */

/**
 * Fetch all orders from Supabase, including their timeline entries.
 * Returns an array of order objects with a `timeline` sub-array.
 */
async function getOrders() {
    const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    if (ordersError) {
        console.error('getOrders error:', ordersError);
        return [];
    }

    // Fetch all timeline entries
    const { data: timelines, error: tlError } = await supabase
        .from('order_timelines')
        .select('*')
        .order('date', { ascending: true });

    if (tlError) {
        console.error('getOrders timeline error:', tlError);
    }

    const tlMap = {};
    if (timelines) {
        timelines.forEach(function (t) {
            if (!tlMap[t.order_id]) tlMap[t.order_id] = [];
            tlMap[t.order_id].push({ status: t.status, date: t.date });
        });
    }

    // Map DB rows to the shape the frontend expects
    return ordersData.map(function (row) {
        return {
            id: row.id,
            merchantId: row.merchant_id,
            firstName: row.first_name,
            lastName: row.last_name,
            customerAddress: row.customer_address,
            productName: row.product_name,
            product: row.product_name,
            wilaya: row.wilaya,
            weight: row.weight,
            notes: row.notes,
            phone: row.phone,
            status: row.status,
            deliveryCompany: row.delivery_company,
            deliveryType: row.delivery_type,
            deliveryNote: row.delivery_note,
            startedAt: row.started_at,
            createdAt: row.created_at,
            timeline: tlMap[row.id] || []
        };
    });
}

/**
 * Insert a new order into Supabase and its initial timeline entry.
 * @param {Object} order – order object in frontend shape
 * @returns {Object|null} the saved order (with DB-generated id) or null on error
 */
async function saveOrder(order) {
    const row = {
        merchant_id: order.merchantId,
        first_name: order.firstName,
        last_name: order.lastName,
        customer_address: order.customerAddress,
        product_name: order.productName,
        wilaya: order.wilaya,
        weight: order.weight,
        notes: order.notes || '',
        phone: order.phone,
        status: order.status || 'pending',
        delivery_company: order.deliveryCompany,
        delivery_type: order.deliveryType,
        delivery_note: order.deliveryNote || '',
        started_at: order.startedAt || null,
        created_at: order.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('orders')
        .insert([row])
        .select()
        .single();

    if (error) {
        console.error('saveOrder error:', error);
        return null;
    }

    // Insert initial timeline entry
    if (order.timeline && order.timeline.length > 0) {
        const tlRows = order.timeline.map(function (t) {
            return { order_id: data.id, status: t.status, date: t.date };
        });
        await supabase.from('order_timelines').insert(tlRows);
    }

    return data;
}

/**
 * Update an existing order's fields in Supabase.
 * @param {number} id – order id
 * @param {Object} fields – plain object with DB column names to update
 */
async function updateOrder(id, fields) {
    const { error } = await supabase
        .from('orders')
        .update(fields)
        .eq('id', id);

    if (error) {
        console.error('updateOrder error:', error);
    }
    return !error;
}

/**
 * Update order status and add a timeline entry.
 */
async function updateOrderStatus(id, newStatus) {
    const updateFields = { status: newStatus };
    if (newStatus === 'in_progress') {
        updateFields.started_at = Date.now();
    }

    const { error } = await supabase
        .from('orders')
        .update(updateFields)
        .eq('id', id);

    if (error) {
        console.error('updateOrderStatus error:', error);
        return false;
    }

    // Add timeline entry
    await supabase.from('order_timelines').insert([{
        order_id: id,
        status: newStatus,
        date: new Date().toISOString()
    }]);

    return true;
}

/**
 * Delete an order and its timeline entries from Supabase.
 */
async function deleteOrder(id) {
    // Delete timeline entries first (FK)
    await supabase.from('order_timelines').delete().eq('order_id', id);

    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteOrder error:', error);
        return false;
    }
    return true;
}

/* ======================================================
   DELIVERY COMPANIES helpers
   ====================================================== */

async function getDeliveryCompanies() {
    const { data, error } = await supabase
        .from('delivery_companies')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('getDeliveryCompanies error:', error);
        return [];
    }
    return data;
}

/* ======================================================
   PROFILES / AUTH helpers
   ====================================================== */

/**
 * Get all profiles from Supabase.
 */
async function getProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error('getProfiles error:', error);
        return [];
    }
    return data;
}

/**
 * Find a single profile by email.
 */
async function getProfileByEmail(email) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (error) {
        console.error('getProfileByEmail error:', error);
        return null;
    }
    return data;
}

/**
 * Insert a new profile into Supabase.
 */
async function createProfile(profile) {
    const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

    if (error) {
        console.error('createProfile error:', error);
        return null;
    }
    return data;
}

/**
 * Update a profile by id.
 */
async function updateProfile(id, fields) {
    const { error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', id);

    if (error) {
        console.error('updateProfile error:', error);
        return false;
    }
    return true;
}
