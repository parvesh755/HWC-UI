import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpServiceService } from 'app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';

@Component({
  selector: 'nurse-genito-urinary-system',
  templateUrl: './genito-urinary-system.component.html',
  styleUrls: ['./genito-urinary-system.component.css']
})
export class GenitoUrinarySystemComponent implements OnInit {

  @Input('genitoUrinarySystemForm')
  genitoUrinarySystemForm: FormGroup;
  current_language_set: any;

  constructor(private fb: FormBuilder,
    public httpServiceService: HttpServiceService) { }

  ngOnInit() {
    this.assignSelectedLanguage();
    // this.httpServiceService.currentLangugae$.subscribe(response =>this.current_language_set = response);
  }

  ngDoCheck() {
    this.assignSelectedLanguage();
  }
  assignSelectedLanguage() {
    const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
    getLanguageJson.setLanguage();
    this.current_language_set = getLanguageJson.currentLanguageObject;
    }

}
