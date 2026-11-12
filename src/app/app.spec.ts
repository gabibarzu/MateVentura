import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Subject } from 'rxjs';
import { App } from './app';
import { provideIcons } from './icons';

describe('App', () => {
  beforeEach(async () => {
    // jsdom does not implement these browser APIs used by the app and Material.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }));
    vi.stubGlobal('ResizeObserver', class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    });
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideIcons()],
    })
      .compileComponents();
  });

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('MateVentura');
  });

  it('pauses before loading the leaderboard, ignores duplicate opens and resumes when closed', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.status.set('playing');
    const pause = vi.spyOn(app, 'pauseGame').mockImplementation(() => {});
    const resume = vi.spyOn(app, 'resumeGame').mockImplementation(() => {});
    let resolve!: (value: any) => void;
    const load = vi.spyOn(app, 'loadLeaderboard').mockImplementation(() => new Promise(done => { resolve = done; }));
    const closed = new Subject<void>();
    const open = vi.spyOn(app.dialog, 'open').mockReturnValue({ afterClosed: () => closed } as any);
    const pending = app.openLeaderboard();
    expect(pause).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    await app.openLeaderboard();
    app.openModeDialog();
    expect(load).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    resolve(class {});
    await pending;
    expect(open).toHaveBeenCalledOnce();
    closed.next();
    expect(resume).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('resumes instead of leaving a game paused if the leaderboard chunk fails', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as any;
    app.status.set('playing');
    vi.spyOn(app, 'pauseGame').mockImplementation(() => {});
    const resume = vi.spyOn(app, 'resumeGame').mockImplementation(() => {});
    vi.spyOn(app, 'loadLeaderboard').mockRejectedValue(new Error('offline'));
    await expect(app.openLeaderboard()).resolves.toBeUndefined();
    expect(resume).toHaveBeenCalledOnce();
    expect(app.leaderboardOpening).toBe(false);
    fixture.destroy();
  });
});
