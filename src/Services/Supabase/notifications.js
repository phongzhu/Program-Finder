import { isSupabaseConfigured, supabase } from './client';

function assertSupabaseReady() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
}

function formatSupabaseError(error, fallback) {
  return error?.message || fallback;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function toNotificationTone(notificationType = '') {
  const normalized = normalizeText(notificationType).toLowerCase();
  if (['document_verified', 'application_approved', 'application_submitted', 'document_uploaded'].includes(normalized)) {
    return 'success';
  }
  if (['document_rejected', 'application_rejected'].includes(normalized)) {
    return 'danger';
  }
  if (['application_requires_action', 'new_document_for_verification', 'new_application_for_review'].includes(normalized)) {
    return 'warning';
  }
  return 'neutral';
}

function formatNotificationTime(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return '';
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function mapNotificationRow(row = {}) {
  return {
    id: row.id || '',
    recipientUserId: row.recipient_user_id || '',
    actorUserId: row.actor_user_id || null,
    recipient: row.recipient_user_id || '',
    notificationType: row.notification_type || '',
    title: row.title || '',
    message: row.message || '',
    relatedTable: row.related_table || '',
    relatedRecordId: row.related_record_id || '',
    actionRoute: row.action_route || '',
    isRead: Boolean(row.is_read),
    unread: !Boolean(row.is_read),
    readAt: row.read_at || '',
    createdAt: row.created_at || '',
    time: formatNotificationTime(row.created_at),
    tone: toNotificationTone(row.notification_type),
  };
}

export async function listUserNotifications(recipientUserId, { limit = 40 } = {}) {
  assertSupabaseReady();
  const userId = normalizeText(recipientUserId);
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      recipient_user_id,
      actor_user_id,
      notification_type,
      title,
      message,
      related_table,
      related_record_id,
      action_route,
      is_read,
      read_at,
      created_at
    `)
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to load notifications.'));
  }

  return (data || []).map(mapNotificationRow);
}

export async function createNotification(payload = {}) {
  assertSupabaseReady();

  const recipientUserId = normalizeText(payload.recipientUserId || payload.recipient_user_id);
  const actorUserId = normalizeText(payload.actorUserId || payload.actor_user_id) || null;
  const notificationType = normalizeText(payload.notificationType || payload.notification_type);
  const title = normalizeText(payload.title);
  const message = normalizeText(payload.message);
  const relatedTable = normalizeText(payload.relatedTable || payload.related_table) || null;
  const relatedRecordId = normalizeText(payload.relatedRecordId || payload.related_record_id) || null;
  const actionRoute = normalizeText(payload.actionRoute || payload.action_route) || null;

  if (!recipientUserId || !notificationType || !title || !message) {
    throw new Error('recipientUserId, notificationType, title, and message are required.');
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      recipient_user_id: recipientUserId,
      actor_user_id: actorUserId,
      notification_type: notificationType,
      title,
      message,
      related_table: relatedTable,
      related_record_id: relatedRecordId,
      action_route: actionRoute,
    })
    .select(`
      id,
      recipient_user_id,
      actor_user_id,
      notification_type,
      title,
      message,
      related_table,
      related_record_id,
      action_route,
      is_read,
      read_at,
      created_at
    `)
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to create notification.'));
  }

  return mapNotificationRow(data);
}

export async function markNotificationAsRead(notificationId, recipientUserId) {
  assertSupabaseReady();

  const id = normalizeText(notificationId);
  const userId = normalizeText(recipientUserId);
  if (!id || !userId) {
    throw new Error('notificationId and recipientUserId are required.');
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('recipient_user_id', userId);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to mark the notification as read.'));
  }
}

export async function markAllNotificationsAsRead(recipientUserId) {
  assertSupabaseReady();

  const userId = normalizeText(recipientUserId);
  if (!userId) {
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('recipient_user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw new Error(formatSupabaseError(error, 'Unable to mark all notifications as read.'));
  }
}

