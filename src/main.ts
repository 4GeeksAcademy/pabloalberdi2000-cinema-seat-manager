import "./style.css";

type SeatState = 0 | 1;
type SeatPair =
  | {
      first: [number, number];
      second: [number, number];
    }
  | null;

class CinemaSeatManager {
  private readonly rows: number;
  private readonly cols: number;
  private readonly seats: SeatState[][];

  constructor(rows = 8, cols = 10) {
    this.rows = rows;
    this.cols = cols;
    this.seats = this.createEmptyMap();
  }

  private createEmptyMap(): SeatState[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => 0 as SeatState),
    );
  }

  public getMap(): SeatState[][] {
    return this.seats.map((row) => [...row]);
  }

  public reserveSeat(row: number, col: number): { ok: boolean; message: string } {
    if (!this.isInsideMap(row, col)) {
      return { ok: false, message: "Asiento fuera del mapa." };
    }

    if (this.seats[row][col] === 1) {
      return { ok: false, message: `Asiento ${this.formatSeat(row, col)} ya ocupado.` };
    }

    this.seats[row][col] = 1;
    return { ok: true, message: `Reserva confirmada en ${this.formatSeat(row, col)}.` };
  }

  public getCounters(): { occupied: number; available: number; total: number } {
    const occupied = this.seats.flat().filter((seat) => seat === 1).length;
    const total = this.rows * this.cols;
    return { occupied, available: total - occupied, total };
  }

  public findFirstContiguousPair(): SeatPair {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols - 1; col += 1) {
        if (this.seats[row][col] === 0 && this.seats[row][col + 1] === 0) {
          return {
            first: [row, col],
            second: [row, col + 1],
          };
        }
      }
    }

    return null;
  }

  public setAllSeats(state: SeatState): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        this.seats[row][col] = state;
      }
    }
  }

  public setPattern(pattern: SeatState[][]): { ok: boolean; message: string } {
    if (pattern.length !== this.rows || pattern.some((row) => row.length !== this.cols)) {
      return { ok: false, message: "Patrón inválido para el tamaño de la sala." };
    }

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        this.seats[row][col] = pattern[row][col];
      }
    }

    return { ok: true, message: "Patrón aplicado correctamente." };
  }

  private isInsideMap(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  private formatSeat(row: number, col: number): string {
    return `F${row + 1}-C${col + 1}`;
  }
}

function createPartialPattern(rows: number, cols: number): SeatState[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      // Pattern with mixed occupancy while guaranteeing at least one contiguous pair.
      if (row === 2 && (col === 4 || col === 5)) return 0;
      if (row % 2 === 0) return (col % 3 === 0 ? 1 : 0) as SeatState;
      return (col % 2 === 0 ? 0 : 1) as SeatState;
    }),
  );
}

function buildApp(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;

  const manager = new CinemaSeatManager(8, 10);
  let highlightedPair: SeatPair = null;

  app.innerHTML = `
    <div class="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="absolute inset-0 -z-10">
        <div class="bg-aurora absolute -left-16 top-8 h-40 w-40 rounded-full blur-3xl"></div>
        <div class="bg-sunrise absolute right-0 top-28 h-44 w-44 rounded-full blur-3xl"></div>
      </div>

      <header class="animate-fade-up mb-8">
        <p class="font-ui text-sm uppercase tracking-[0.2em] text-slate-600">Sistema de Reservas</p>
        <h1 class="font-display mt-2 text-4xl font-semibold text-slate-900 sm:text-5xl">Cinema Seat Manager</h1>
        <p class="mt-3 max-w-2xl text-slate-600">
          Haz clic en un asiento libre para reservarlo. También puedes buscar el primer par contiguo disponible en la misma fila.
        </p>
      </header>

      <section class="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside class="animate-fade-up rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur delay-75">
          <h2 class="font-display text-xl font-semibold">Panel</h2>

          <div class="mt-4 space-y-3">
            <div class="rounded-2xl bg-emerald-50 p-3">
              <p class="text-xs uppercase tracking-wider text-emerald-700">Disponibles</p>
              <p id="available-count" class="font-display text-3xl text-emerald-800">0</p>
            </div>
            <div class="rounded-2xl bg-rose-50 p-3">
              <p class="text-xs uppercase tracking-wider text-rose-700">Ocupados</p>
              <p id="occupied-count" class="font-display text-3xl text-rose-800">0</p>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-2">
            <button id="find-pair" class="btn btn-primary" type="button">Buscar 2 asientos contiguos</button>
            <button id="empty-room" class="btn btn-secondary" type="button">Escenario: Sala vacía</button>
            <button id="partial-room" class="btn btn-secondary" type="button">Escenario: Sala parcial</button>
            <button id="full-room" class="btn btn-secondary" type="button">Escenario: Sala llena</button>
          </div>

          <p id="status" class="mt-4 rounded-xl bg-slate-900 px-3 py-2 text-sm text-slate-100">
            Sala inicializada. Selecciona un asiento libre para empezar.
          </p>
        </aside>

        <div class="animate-fade-up rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur delay-150">
          <div class="mb-5 flex items-center justify-between gap-2">
            <h2 class="font-display text-xl font-semibold">Mapa de asientos (8 x 10)</h2>
            <div class="flex items-center gap-3 text-xs text-slate-600">
              <span class="inline-flex items-center gap-1"><i class="legend legend-free"></i> Libre (L)</span>
              <span class="inline-flex items-center gap-1"><i class="legend legend-occupied"></i> Ocupado (X)</span>
              <span class="inline-flex items-center gap-1"><i class="legend legend-focus"></i> Par encontrado</span>
            </div>
          </div>

          <div id="seat-grid" class="grid grid-cols-10 gap-2"></div>
        </div>
      </section>
    </div>
  `;

  const seatGrid = app.querySelector<HTMLDivElement>("#seat-grid");
  const statusEl = app.querySelector<HTMLParagraphElement>("#status");
  const availableCountEl = app.querySelector<HTMLParagraphElement>("#available-count");
  const occupiedCountEl = app.querySelector<HTMLParagraphElement>("#occupied-count");
  const findPairBtn = app.querySelector<HTMLButtonElement>("#find-pair");
  const emptyBtn = app.querySelector<HTMLButtonElement>("#empty-room");
  const partialBtn = app.querySelector<HTMLButtonElement>("#partial-room");
  const fullBtn = app.querySelector<HTMLButtonElement>("#full-room");

  if (
    !seatGrid ||
    !statusEl ||
    !availableCountEl ||
    !occupiedCountEl ||
    !findPairBtn ||
    !emptyBtn ||
    !partialBtn ||
    !fullBtn
  ) {
    return;
  }

  const paint = (message?: string) => {
    const map = manager.getMap();
    const counters = manager.getCounters();

    availableCountEl.textContent = String(counters.available);
    occupiedCountEl.textContent = String(counters.occupied);

    if (message) {
      statusEl.textContent = message;
    }

    const pairSet = new Set<string>();
    if (highlightedPair) {
      pairSet.add(`${highlightedPair.first[0]}-${highlightedPair.first[1]}`);
      pairSet.add(`${highlightedPair.second[0]}-${highlightedPair.second[1]}`);
    }

    seatGrid.innerHTML = map
      .map((row, rowIdx) =>
        row
          .map((seat, colIdx) => {
            const key = `${rowIdx}-${colIdx}`;
            const highlighted = pairSet.has(key);
            const isOccupied = seat === 1;
            const base = "seat-cell";
            const stateClass = isOccupied ? "seat-occupied" : "seat-available";
            const focusClass = highlighted ? "seat-highlight" : "";
            const label = isOccupied ? "X" : "L";

            return `
              <button
                type="button"
                class="${base} ${stateClass} ${focusClass}"
                data-row="${rowIdx}"
                data-col="${colIdx}"
                ${isOccupied ? "disabled" : ""}
                aria-label="Fila ${rowIdx + 1}, columna ${colIdx + 1}, ${isOccupied ? "ocupado" : "libre"}"
              >
                <span class="text-sm font-semibold">${label}</span>
                <span class="text-[10px] opacity-80">${rowIdx + 1}-${colIdx + 1}</span>
              </button>
            `;
          })
          .join(""),
      )
      .join("");
  };

  seatGrid.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>("button[data-row][data-col]");
    if (!button) return;

    const row = Number(button.dataset.row);
    const col = Number(button.dataset.col);
    highlightedPair = null;
    const result = manager.reserveSeat(row, col);
    paint(result.message);
  });

  findPairBtn.addEventListener("click", () => {
    const pair = manager.findFirstContiguousPair();
    highlightedPair = pair;

    if (!pair) {
      paint("No hay dos asientos contiguos disponibles.");
      return;
    }

    const first = `F${pair.first[0] + 1}-C${pair.first[1] + 1}`;
    const second = `F${pair.second[0] + 1}-C${pair.second[1] + 1}`;
    paint(`Par contiguo encontrado: ${first} y ${second}.`);
  });

  emptyBtn.addEventListener("click", () => {
    highlightedPair = null;
    manager.setAllSeats(0);
    paint("Escenario aplicado: sala completamente vacía.");
  });

  partialBtn.addEventListener("click", () => {
    highlightedPair = null;
    const pattern = createPartialPattern(8, 10);
    const result = manager.setPattern(pattern);
    paint(`Escenario aplicado: sala parcialmente ocupada. ${result.message}`);
  });

  fullBtn.addEventListener("click", () => {
    highlightedPair = null;
    manager.setAllSeats(1);
    paint("Escenario aplicado: sala completamente llena.");
  });

  paint();
}

if (typeof document !== "undefined") {
  buildApp();
}
