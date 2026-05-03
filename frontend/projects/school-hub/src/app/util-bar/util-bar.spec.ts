import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtilBar } from './util-bar';

describe('UtilBar', () => {
  let component: UtilBar;
  let fixture: ComponentFixture<UtilBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtilBar],
    }).compileComponents();

    fixture = TestBed.createComponent(UtilBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
