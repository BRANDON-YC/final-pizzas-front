import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ChargersComponent } from './chargers.component';

describe('ChargersComponent', () => {
  let component: ChargersComponent;
  let fixture: ComponentFixture<ChargersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChargersComponent],
      providers: [provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChargersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
