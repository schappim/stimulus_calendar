StimulusCalendarRails::Engine.routes.draw do
  # Range-windowed event source — RAILS.md §8.
  get "/:resource/events", to: "events#index", as: :index_events

  # Create / update / destroy individual events — RAILS.md §8 / §14 / §15.
  post   "/:resource/events",            to: "events#create",  as: :events
  patch  "/:resource/events/:id",        to: "events#update",  as: :event,
         constraints: { id: /[^\/]+/ }
  delete "/:resource/events/bulk",       to: "events#destroy_bulk", as: :bulk_events
  delete "/:resource/events/:id",        to: "events#destroy", as: :destroy_event,
         constraints: { id: /[^\/]+/ }

  # Bulk drag/resize/edit — apply N changes in a single transaction.
  post "/:resource/bulk", to: "events#bulk", as: :bulk

  # Resources (calendar sidebar) — Phase 8.
  get "/:resource/resources", to: "resources#index", as: :index_resources

  # Undo / redo were reserved for the audit-table phase but never wired —
  # routes removed so they don't 500 when called.
end
