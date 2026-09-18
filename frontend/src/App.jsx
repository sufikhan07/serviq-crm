import { useCallback, useEffect, useMemo, useState } from "react";
import "./index.css";

const API_URL = "http://127.0.0.1:8000";

const emptyForm = {
  customer_name: "",
  customer_email: "",
  subject: "",
  description: "",
};

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updateStatus, setUpdateStatus] = useState("Open");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/tickets`);
      const data = await response.json();
      setTickets(data);
    } catch {
      setMessage("Cannot connect to the backend. Check that it is running.");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const query = search.toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !query ||
        ticket.ticket_id.toLowerCase().includes(query) ||
        ticket.customer_name.toLowerCase().includes(query) ||
        ticket.customer_email.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const counts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "Open").length,
      progress: tickets.filter(
        (ticket) => ticket.status === "In Progress"
      ).length,
      closed: tickets.filter((ticket) => ticket.status === "Closed").length,
    }),
    [tickets]
  );

  const showPage = (page) => {
    setActivePage(page);
    setSelectedTicket(null);
    setMessage("");
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        setMessage("Please check all fields and enter a valid email.");
        return;
      }

      const data = await response.json();
      setForm(emptyForm);
      await loadTickets();
      setMessage(`${data.ticket_id} was created successfully.`);
      setActivePage("tickets");
    } catch {
      setMessage("Cannot connect to the backend.");
    }
  };

  const openTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticketId}`);
      const data = await response.json();

      setSelectedTicket(data);
      setUpdateStatus(data.status);
      setNote("");
      setActivePage("tickets");
    } catch {
      setMessage("Could not load this ticket.");
    }
  };

  const handleUpdateTicket = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/tickets/${selectedTicket.ticket_id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: updateStatus,
            notes: note,
          }),
        }
      );

      if (!response.ok) {
        setMessage("Could not update this ticket.");
        return;
      }

      await openTicket(selectedTicket.ticket_id);
      await loadTickets();
      setMessage("Ticket updated successfully.");
    } catch {
      setMessage("Cannot connect to the backend.");
    }
  };

  const statusClass = (status) => status.replace(" ", "-");

  return (
    <div className="crm-layout">
      <aside className="sidebar">
        <button className="brand" onClick={() => showPage("dashboard")}>
          <span className="brand-mark">S</span>
          <span>Serviq</span>
        </button>

        <p className="menu-title">WORKSPACE</p>

        <nav>
          <button
            className={activePage === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => showPage("dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={activePage === "tickets" ? "nav-item active" : "nav-item"}
            onClick={() => showPage("tickets")}
          >
            <span>◫</span> Tickets
          </button>

          <button
            className={activePage === "create" ? "nav-item active" : "nav-item"}
            onClick={() => showPage("create")}
          >
            <span>＋</span> New Ticket
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="online-dot" />
          <div>
            <strong>Support team</strong>
            <span>System online</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {message && <div className="message">{message}</div>}

        {activePage === "dashboard" && (
          <>
            <section className="page-header">
              <div>
                <p className="eyebrow">OVERVIEW</p>
                <h1>Support dashboard</h1>
                <p>Track your customer-support activity from one place.</p>
              </div>

              <button className="primary-button" onClick={() => showPage("create")}>
                + Create ticket
              </button>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-icon purple">◫</span>
                <p>Total tickets</p>
                <strong>{counts.total}</strong>
                <small>All recorded support requests</small>
              </article>

              <article className="stat-card">
                <span className="stat-icon orange">○</span>
                <p>Open</p>
                <strong>{counts.open}</strong>
                <small>Waiting for support action</small>
              </article>

              <article className="stat-card">
                <span className="stat-icon blue">↻</span>
                <p>In progress</p>
                <strong>{counts.progress}</strong>
                <small>Currently being handled</small>
              </article>

              <article className="stat-card">
                <span className="stat-icon green">✓</span>
                <p>Closed</p>
                <strong>{counts.closed}</strong>
                <small>Resolved support requests</small>
              </article>
            </section>

            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Ticket status overview</h2>
                    <p>Live data from your support database</p>
                  </div>
                </div>

                <div className="status-summary">
                  {[
                    ["Open", counts.open, "orange"],
                    ["In Progress", counts.progress, "blue"],
                    ["Closed", counts.closed, "green"],
                  ].map(([label, value, color]) => (
                    <div className="summary-row" key={label}>
                      <div>
                        <span className={`summary-dot ${color}`} />
                        {label}
                      </div>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel quick-panel">
                <p className="eyebrow">QUICK ACTION</p>
                <h2>Need to report an issue?</h2>
                <p>Create a support ticket and keep every customer update organised.</p>
                <button className="dark-button" onClick={() => showPage("create")}>
                  Create new ticket
                </button>
              </article>
            </section>

            <section className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h2>Recent tickets</h2>
                  <p>Latest customer-support requests</p>
                </div>

                <button className="text-button" onClick={() => showPage("tickets")}>
                  View all →
                </button>
              </div>

              {tickets.length === 0 ? (
                <p className="empty">No tickets yet. Create the first one.</p>
              ) : (
                <div className="ticket-table">
                  {tickets.slice(0, 5).map((ticket) => (
                    <button
                      className="table-row"
                      key={ticket.ticket_id}
                      onClick={() => openTicket(ticket.ticket_id)}
                    >
                      <strong>{ticket.ticket_id}</strong>
                      <span>{ticket.customer_name}</span>
                      <span className="subject-cell">{ticket.subject}</span>
                      <span className={`status ${statusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {activePage === "create" && (
          <section className="create-page">
            <div className="page-header">
              <div>
                <p className="eyebrow">NEW REQUEST</p>
                <h1>Create a support ticket</h1>
                <p>Add complete customer details so your team can resolve the issue quickly.</p>
              </div>
            </div>

            <form className="panel ticket-form" onSubmit={handleCreateTicket}>
              <div className="form-section">
                <h2>Customer information</h2>

                <div className="two-column">
                  <label>
                    Customer name
                    <input
                      value={form.customer_name}
                      onChange={(event) =>
                        setForm({ ...form, customer_name: event.target.value })
                      }
                      placeholder="Enter full name"
                      required
                    />
                  </label>

                  <label>
                    Customer email
                    <input
                      type="email"
                      value={form.customer_email}
                      onChange={(event) =>
                        setForm({ ...form, customer_email: event.target.value })
                      }
                      placeholder="name@email.com"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-section">
                <h2>Issue details</h2>

                <label>
                  Issue title
                  <input
                    value={form.subject}
                    onChange={(event) =>
                      setForm({ ...form, subject: event.target.value })
                    }
                    placeholder="Example: Unable to complete payment"
                    required
                  />
                </label>

                <label>
                  Issue description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="Describe the issue, including important steps or error details."
                    required
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => showPage("dashboard")}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  Create ticket
                </button>
              </div>
            </form>
          </section>
        )}

        {activePage === "tickets" && (
          <>
            <section className="page-header">
              <div>
                <p className="eyebrow">TICKET MANAGEMENT</p>
                <h1>Support tickets</h1>
                <p>Search requests, view complete details, and update their progress.</p>
              </div>

              <button className="primary-button" onClick={() => showPage("create")}>
                + Create ticket
              </button>
            </section>

            <section className="panel">
              <div className="filters">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ticket ID, name, email, or issue..."
                />

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <p className="results-label">{filteredTickets.length} ticket(s) found</p>

              <div className="ticket-table">
                {filteredTickets.length === 0 ? (
                  <p className="empty">No tickets match your search.</p>
                ) : (
                  filteredTickets.map((ticket) => (
                    <button
                      className="table-row"
                      key={ticket.ticket_id}
                      onClick={() => openTicket(ticket.ticket_id)}
                    >
                      <strong>{ticket.ticket_id}</strong>
                      <span>{ticket.customer_name}</span>
                      <span className="subject-cell">{ticket.subject}</span>
                      <span className={`status ${statusClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            {selectedTicket && (
              <section className="panel detail-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">{selectedTicket.ticket_id}</p>
                    <h2>{selectedTicket.subject}</h2>
                    <p>
                      {selectedTicket.customer_name} · {selectedTicket.customer_email}
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Close details
                  </button>
                </div>

                <p className="description">{selectedTicket.description}</p>

                <form className="update-form" onSubmit={handleUpdateTicket}>
                  <label>
                    Update status
                    <select
                      value={updateStatus}
                      onChange={(event) => setUpdateStatus(event.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>

                  <label>
                    Add team note
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Write an internal update..."
                    />
                  </label>

                  <button type="submit" className="primary-button">
                    Save update
                  </button>
                </form>

                <div className="notes">
                  <h3>Activity notes</h3>

                  {selectedTicket.notes.length === 0 ? (
                    <p className="empty">No notes have been added yet.</p>
                  ) : (
                    selectedTicket.notes.map((item) => (
                      <article className="note" key={item.id}>
                        <p>{item.note_text}</p>
                        <small>{new Date(item.created_at).toLocaleString()}</small>
                      </article>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;