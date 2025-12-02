import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CellphonesComponent } from './cellphones.component';

describe('CellphonesComponent', () => {
  let component: CellphonesComponent;
  let fixture: ComponentFixture<CellphonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CellphonesComponent],
      providers: [provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CellphonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
