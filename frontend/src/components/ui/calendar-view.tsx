'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import { EventInput, EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  events: EventInput[]
  onEventClick?: (event: EventClickArg) => void
  onDateSelect?: (selectInfo: DateSelectArg) => void
  onEventDrop?: (info: any) => void
  className?: string
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'
}

export function CalendarView({
  events,
  onEventClick,
  onDateSelect,
  onEventDrop,
  className,
  initialView = 'dayGridMonth'
}: CalendarViewProps) {
  const calendarProps: any = {
    plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin],
    initialView,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    },
    events,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    height: "100%",
    eventClassNames: "cursor-pointer",
    eventColor: "#3b82f6",
    eventTextColor: "#ffffff",
    themeSystem: "standard"
  }

  if (onEventClick) calendarProps.eventClick = onEventClick
  if (onDateSelect) calendarProps.select = onDateSelect
  if (onEventDrop) calendarProps.eventDrop = onEventDrop

  return (
    <div className={cn('calendar-wrapper', className)}>
      <FullCalendar {...calendarProps} />
      <style jsx global>{`
        .calendar-wrapper {
          --fc-border-color: rgb(31 41 55);
          --fc-button-bg-color: rgb(31 41 55);
          --fc-button-border-color: rgb(31 41 55);
          --fc-button-hover-bg-color: rgb(55 65 81);
          --fc-button-hover-border-color: rgb(55 65 81);
          --fc-button-active-bg-color: rgb(59 130 246);
          --fc-button-active-border-color: rgb(59 130 246);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgb(17 24 39 / 0.5);
          --fc-list-event-hover-bg-color: rgb(31 41 55);
          --fc-today-bg-color: rgb(59 130 246 / 0.1);
        }
        
        .fc {
          color: rgb(209 213 219);
        }
        
        .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .fc-button {
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.25rem 0.75rem;
        }
        
        .fc-daygrid-event {
          border: none;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 0.75rem;
        }
        
        .fc-event-time {
          font-weight: 600;
        }
        
        .fc-day-today {
          background-color: var(--fc-today-bg-color) !important;
        }
        
        .fc-col-header-cell {
          font-weight: 600;
          padding: 0.5rem 0;
        }
        
        .fc th {
          font-weight: 600;
        }
        
        .fc-list-event:hover td {
          background-color: var(--fc-list-event-hover-bg-color);
        }
        
        .fc-scrollgrid {
          border-radius: 0.5rem;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}