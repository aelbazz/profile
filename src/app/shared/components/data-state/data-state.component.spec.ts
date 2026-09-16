import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataStateComponent } from './data-state.component';

describe('DataStateComponent', () => {
  let fixture: ComponentFixture<DataStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DataStateComponent);
    fixture.componentRef.setInput('label', 'projects');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show a spinner while loading', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.spinner-border')).toBeTruthy();
    expect(el.textContent).toContain('Loading projects');
    expect(el.querySelector('.data-state-retry')).toBeNull();
  });

  it('should show a retry button on error', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.spinner-border')).toBeNull();
    expect(el.textContent).toContain("Couldn't load projects");
    expect(el.querySelector('.data-state-retry')).toBeTruthy();
  });

  it('should emit retry when the button is clicked', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.detectChanges();

    let emitted = 0;
    fixture.componentInstance.retry.subscribe(() => emitted++);

    const button = fixture.nativeElement.querySelector('.data-state-retry') as HTMLButtonElement;
    button.click();

    expect(emitted).toBe(1);
  });
});
