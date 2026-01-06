/**
 * Cloudflare Worker for Data Sync (Tasks, Meetings, Projects, Schedule)
 * 
 * This handles:
 * - GET/POST/PUT/DELETE for projects
 * - GET/POST/PUT/DELETE for tasks
 * - GET/POST/PUT/DELETE for meetings
 * - GET/POST/PUT/DELETE for schedule items
 * 
 * Requires:
 * - Cloudflare D1 database
 * - Session-based authentication (cookie)
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/data', '');

  // CORS headers (allow credentials for cookies)
  const corsHeaders = {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get user ID from session cookie
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = cookieHeader?.split(';').find(c => c.trim().startsWith('session='))?.split('=')[1];

  if (!sessionId) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let userId;
  try {
    const session = await env.DB.prepare(
      'SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?'
    ).bind(sessionId, new Date().toISOString()).first();

    if (!session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    userId = session.user_id;
  } catch (error) {
    console.error('[DATA] Session verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid session' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Projects endpoints
    if (path === '/projects' && request.method === 'GET') {
      const projects = await env.DB.prepare(
        'SELECT id, name, color, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY id'
      ).bind(userId).all();
      
      return new Response(
        JSON.stringify(projects.results || []),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/projects' && request.method === 'POST') {
      const { name, color } = await request.json();
      if (!name || !color) {
        return new Response(
          JSON.stringify({ error: 'Name and color are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await env.DB.prepare(
        'INSERT INTO projects (user_id, name, color, created_at) VALUES (?, ?, ?, ?)'
      ).bind(userId, name, color, new Date().toISOString()).run();

      const project = await env.DB.prepare(
        'SELECT id, name, color, created_at, updated_at FROM projects WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return new Response(
        JSON.stringify(project),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/projects/') && request.method === 'PUT') {
      const projectId = parseInt(path.split('/')[2]);
      const { name, color } = await request.json();

      await env.DB.prepare(
        'UPDATE projects SET name = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(name, color, new Date().toISOString(), projectId, userId).run();

      const project = await env.DB.prepare(
        'SELECT id, name, color, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?'
      ).bind(projectId, userId).first();

      return new Response(
        JSON.stringify(project),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/projects/') && request.method === 'DELETE') {
      const projectId = parseInt(path.split('/')[2]);
      await env.DB.prepare(
        'DELETE FROM projects WHERE id = ? AND user_id = ?'
      ).bind(projectId, userId).run();

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tasks endpoints
    if (path === '/tasks' && request.method === 'GET') {
      const tasks = await env.DB.prepare(
        'SELECT id, title, status, duration, priority, project_id as projectId, notes, due_date as dueDate, sticker, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY id'
      ).bind(userId).all();

      // Convert to app format
      const formattedTasks = (tasks.results || []).map(task => ({
        ...task,
        dueDate: task.dueDate || null,
        notes: task.notes || '',
        sticker: task.sticker || ''
      }));

      return new Response(
        JSON.stringify(formattedTasks),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/tasks' && request.method === 'POST') {
      const { title, status, duration, priority, projectId, notes, dueDate, sticker } = await request.json();
      if (!title) {
        return new Response(
          JSON.stringify({ error: 'Title is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await env.DB.prepare(
        'INSERT INTO tasks (user_id, title, status, duration, priority, project_id, notes, due_date, sticker, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        userId,
        title,
        status || 'backlog',
        duration || 1,
        priority || 'medium',
        projectId || null,
        notes || '',
        dueDate || null,
        sticker || '',
        new Date().toISOString()
      ).run();

      const task = await env.DB.prepare(
        'SELECT id, title, status, duration, priority, project_id as projectId, notes, due_date as dueDate, sticker FROM tasks WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return new Response(
        JSON.stringify({ ...task, dueDate: task.dueDate || null }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/tasks/') && request.method === 'PUT') {
      const taskId = parseInt(path.split('/')[2]);
      const { title, status, duration, priority, projectId, notes, dueDate, sticker } = await request.json();

      await env.DB.prepare(
        'UPDATE tasks SET title = ?, status = ?, duration = ?, priority = ?, project_id = ?, notes = ?, due_date = ?, sticker = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(
        title,
        status,
        duration,
        priority,
        projectId || null,
        notes || '',
        dueDate || null,
        sticker || '',
        new Date().toISOString(),
        taskId,
        userId
      ).run();

      const task = await env.DB.prepare(
        'SELECT id, title, status, duration, priority, project_id as projectId, notes, due_date as dueDate, sticker FROM tasks WHERE id = ? AND user_id = ?'
      ).bind(taskId, userId).first();

      return new Response(
        JSON.stringify({ ...task, dueDate: task.dueDate || null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/tasks/') && request.method === 'DELETE') {
      const taskId = parseInt(path.split('/')[2]);
      await env.DB.prepare(
        'DELETE FROM tasks WHERE id = ? AND user_id = ?'
      ).bind(taskId, userId).run();

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Meetings endpoints
    if (path === '/meetings' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      let query = 'SELECT id, title, start, duration, date, project_id as projectId, is_break as isBreak, break_type as breakType, break_color as breakColor, is_recurring as isRecurring, repeat_days as repeatDays FROM meetings WHERE user_id = ?';
      const params = [userId];

      if (date) {
        query += ' AND date = ?';
        params.push(date);
      }

      query += ' ORDER BY start';

      const meetings = await env.DB.prepare(query).bind(...params).all();
      const formattedMeetings = (meetings.results || []).map(m => ({
        ...m,
        isBreak: m.isBreak === 1,
        isRecurring: m.isRecurring === 1,
        repeatDays: m.repeatDays ? JSON.parse(m.repeatDays) : null
      }));

      return new Response(
        JSON.stringify(formattedMeetings),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/meetings' && request.method === 'POST') {
      const meeting = await request.json();
      const { title, start, duration, date, projectId, isBreak, breakType, breakColor, isRecurring, repeatDays } = meeting;

      if (!title || !start || !duration || !date) {
        return new Response(
          JSON.stringify({ error: 'Title, start, duration, and date are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await env.DB.prepare(
        'INSERT INTO meetings (user_id, title, start, duration, date, project_id, is_break, break_type, break_color, is_recurring, repeat_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        userId,
        title,
        start,
        duration,
        date,
        projectId || null,
        isBreak ? 1 : 0,
        breakType || null,
        breakColor || null,
        isRecurring ? 1 : 0,
        repeatDays ? JSON.stringify(repeatDays) : null,
        new Date().toISOString()
      ).run();

      const newMeeting = await env.DB.prepare(
        'SELECT id, title, start, duration, date, project_id as projectId, is_break as isBreak, break_type as breakType, break_color as breakColor, is_recurring as isRecurring, repeat_days as repeatDays FROM meetings WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return new Response(
        JSON.stringify({
          ...newMeeting,
          isBreak: newMeeting.isBreak === 1,
          isRecurring: newMeeting.isRecurring === 1,
          repeatDays: newMeeting.repeatDays ? JSON.parse(newMeeting.repeatDays) : null
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/meetings/') && request.method === 'PUT') {
      const meetingId = parseInt(path.split('/')[2]);
      const meeting = await request.json();
      const { title, start, duration, date, projectId, isBreak, breakType, breakColor, isRecurring, repeatDays } = meeting;

      await env.DB.prepare(
        'UPDATE meetings SET title = ?, start = ?, duration = ?, date = ?, project_id = ?, is_break = ?, break_type = ?, break_color = ?, is_recurring = ?, repeat_days = ?, updated_at = ? WHERE id = ? AND user_id = ?'
      ).bind(
        title,
        start,
        duration,
        date,
        projectId || null,
        isBreak ? 1 : 0,
        breakType || null,
        breakColor || null,
        isRecurring ? 1 : 0,
        repeatDays ? JSON.stringify(repeatDays) : null,
        new Date().toISOString(),
        meetingId,
        userId
      ).run();

      const updatedMeeting = await env.DB.prepare(
        'SELECT id, title, start, duration, date, project_id as projectId, is_break as isBreak, break_type as breakType, break_color as breakColor, is_recurring as isRecurring, repeat_days as repeatDays FROM meetings WHERE id = ? AND user_id = ?'
      ).bind(meetingId, userId).first();

      return new Response(
        JSON.stringify({
          ...updatedMeeting,
          isBreak: updatedMeeting.isBreak === 1,
          isRecurring: updatedMeeting.isRecurring === 1,
          repeatDays: updatedMeeting.repeatDays ? JSON.parse(updatedMeeting.repeatDays) : null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/meetings/') && request.method === 'DELETE') {
      const meetingId = parseInt(path.split('/')[2]);
      await env.DB.prepare(
        'DELETE FROM meetings WHERE id = ? AND user_id = ?'
      ).bind(meetingId, userId).run();

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Schedule items endpoints
    if (path === '/schedule' && request.method === 'GET') {
      const date = url.searchParams.get('date');
      let query = 'SELECT id, task_id as taskId, task_title as taskTitle, start, duration, date, is_chunk as isChunk, chunk_index as chunkIndex, total_chunks as totalChunks FROM schedule_items WHERE user_id = ?';
      const params = [userId];

      if (date) {
        query += ' AND date = ?';
        params.push(date);
      }

      query += ' ORDER BY start';

      const schedule = await env.DB.prepare(query).bind(...params).all();
      const formattedSchedule = (schedule.results || []).map(s => ({
        ...s,
        isChunk: s.isChunk === 1
      }));

      return new Response(
        JSON.stringify(formattedSchedule),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/schedule' && request.method === 'POST') {
      const scheduleItem = await request.json();
      const { taskId, taskTitle, start, duration, date, isChunk, chunkIndex, totalChunks } = scheduleItem;

      if (!taskId || !taskTitle || !start || !duration || !date) {
        return new Response(
          JSON.stringify({ error: 'Task ID, title, start, duration, and date are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await env.DB.prepare(
        'INSERT INTO schedule_items (user_id, task_id, task_title, start, duration, date, is_chunk, chunk_index, total_chunks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        userId,
        taskId,
        taskTitle,
        start,
        duration,
        date,
        isChunk ? 1 : 0,
        chunkIndex || null,
        totalChunks || null,
        new Date().toISOString()
      ).run();

      const newItem = await env.DB.prepare(
        'SELECT id, task_id as taskId, task_title as taskTitle, start, duration, date, is_chunk as isChunk, chunk_index as chunkIndex, total_chunks as totalChunks FROM schedule_items WHERE id = ?'
      ).bind(result.meta.last_row_id).first();

      return new Response(
        JSON.stringify({ ...newItem, isChunk: newItem.isChunk === 1 }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.startsWith('/schedule/') && request.method === 'DELETE') {
      const scheduleId = parseInt(path.split('/')[2]);
      await env.DB.prepare(
        'DELETE FROM schedule_items WHERE id = ? AND user_id = ?'
      ).bind(scheduleId, userId).run();

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Bulk sync endpoint (for initial sync)
    if (path === '/sync' && request.method === 'POST') {
      const { projects, tasks, meetings, schedule } = await request.json();

      // Start transaction-like operations
      const results = { projects: [], tasks: [], meetings: [], schedule: [] };

      // Sync projects
      if (projects && Array.isArray(projects)) {
        for (const project of projects) {
          if (project.id) {
            // Update existing
            await env.DB.prepare(
              'UPDATE projects SET name = ?, color = ?, updated_at = ? WHERE id = ? AND user_id = ?'
            ).bind(project.name, project.color, new Date().toISOString(), project.id, userId).run();
            results.projects.push(project);
          } else {
            // Insert new
            const result = await env.DB.prepare(
              'INSERT INTO projects (user_id, name, color, created_at) VALUES (?, ?, ?, ?)'
            ).bind(userId, project.name, project.color, new Date().toISOString()).run();
            results.projects.push({ ...project, id: result.meta.last_row_id });
          }
        }
      }

      // Sync tasks
      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          if (task.id) {
            await env.DB.prepare(
              'UPDATE tasks SET title = ?, status = ?, duration = ?, priority = ?, project_id = ?, notes = ?, due_date = ?, sticker = ?, updated_at = ? WHERE id = ? AND user_id = ?'
            ).bind(
              task.title, task.status, task.duration, task.priority,
              task.projectId || null, task.notes || '', task.dueDate || null,
              task.sticker || '', new Date().toISOString(), task.id, userId
            ).run();
            results.tasks.push(task);
          } else {
            const result = await env.DB.prepare(
              'INSERT INTO tasks (user_id, title, status, duration, priority, project_id, notes, due_date, sticker, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              userId, task.title, task.status || 'backlog', task.duration || 1,
              task.priority || 'medium', task.projectId || null, task.notes || '',
              task.dueDate || null, task.sticker || '', new Date().toISOString()
            ).run();
            results.tasks.push({ ...task, id: result.meta.last_row_id });
          }
        }
      }

      // Sync meetings
      if (meetings && Array.isArray(meetings)) {
        for (const meeting of meetings) {
          if (meeting.id) {
            await env.DB.prepare(
              'UPDATE meetings SET title = ?, start = ?, duration = ?, date = ?, project_id = ?, is_break = ?, break_type = ?, break_color = ?, is_recurring = ?, repeat_days = ?, updated_at = ? WHERE id = ? AND user_id = ?'
            ).bind(
              meeting.title, meeting.start, meeting.duration, meeting.date,
              meeting.projectId || null, meeting.isBreak ? 1 : 0,
              meeting.breakType || null, meeting.breakColor || null,
              meeting.isRecurring ? 1 : 0,
              meeting.repeatDays ? JSON.stringify(meeting.repeatDays) : null,
              new Date().toISOString(), meeting.id, userId
            ).run();
            results.meetings.push(meeting);
          } else {
            const result = await env.DB.prepare(
              'INSERT INTO meetings (user_id, title, start, duration, date, project_id, is_break, break_type, break_color, is_recurring, repeat_days, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              userId, meeting.title, meeting.start, meeting.duration, meeting.date,
              meeting.projectId || null, meeting.isBreak ? 1 : 0,
              meeting.breakType || null, meeting.breakColor || null,
              meeting.isRecurring ? 1 : 0,
              meeting.repeatDays ? JSON.stringify(meeting.repeatDays) : null,
              new Date().toISOString()
            ).run();
            results.meetings.push({ ...meeting, id: result.meta.last_row_id });
          }
        }
      }

      // Sync schedule
      if (schedule && Array.isArray(schedule)) {
        for (const item of schedule) {
          if (item.id) {
            await env.DB.prepare(
              'UPDATE schedule_items SET task_id = ?, task_title = ?, start = ?, duration = ?, date = ?, is_chunk = ?, chunk_index = ?, total_chunks = ?, updated_at = ? WHERE id = ? AND user_id = ?'
            ).bind(
              item.taskId, item.taskTitle, item.start, item.duration, item.date,
              item.isChunk ? 1 : 0, item.chunkIndex || null, item.totalChunks || null,
              new Date().toISOString(), item.id, userId
            ).run();
            results.schedule.push(item);
          } else {
            const result = await env.DB.prepare(
              'INSERT INTO schedule_items (user_id, task_id, task_title, start, duration, date, is_chunk, chunk_index, total_chunks, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              userId, item.taskId, item.taskTitle, item.start, item.duration, item.date,
              item.isChunk ? 1 : 0, item.chunkIndex || null, item.totalChunks || null,
              new Date().toISOString()
            ).run();
            results.schedule.push({ ...item, id: result.meta.last_row_id });
          }
        }
      }

      return new Response(
        JSON.stringify(results),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Data API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

