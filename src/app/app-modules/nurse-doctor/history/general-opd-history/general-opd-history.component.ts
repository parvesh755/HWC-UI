import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BeneficiaryDetailsService } from '../../../core/services/beneficiary-details.service'
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { DoctorService } from '../../shared/services';
import { HttpServiceService } from 'app/app-modules/core/services/http-service.service';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';
import { NcdScreeningService } from '../../shared/services/ncd-screening.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'nurse-general-opd-history',
  templateUrl: './general-opd-history.component.html',
  styleUrls: ['./general-opd-history.component.css']
})
export class GeneralOpdHistoryComponent implements OnInit, DoCheck {

  @Input('patientHistoryForm')
  patientHistoryForm: FormGroup;

  @Input('mode')
  mode: any;

  @Input('visitCategory')
  visitCategory: any;

  @Input('primeGravidaStatus')
  primiGravida: any;

  @Input('pregnancyStatus')
  pregnancyStatus: any;

  beneficiary: any;
  showObstetricHistory = false;
  currentLanguageSet: any;
  historyFormDeclared: boolean = false;
  enablingHistorySectionSubscription: Subscription;
  	
  beneficiaryAge: number = 0;
  benAge: number;
  showHistory: boolean =false;
  

  constructor(
    private beneficiaryDetailsService: BeneficiaryDetailsService,
    private doctorService: DoctorService,
    public httpServiceService: HttpServiceService,
    private confirmationService: ConfirmationService,
    private ncdScreeningService: NcdScreeningService) { }

  ngOnInit() {
    this.assignSelectedLanguage();
    this.getBeneficiaryDetails();
    this.enableIdrsHistoryForm();
    console.log("showHistory",this.showHistory);
    // this.enableHistoryOnIDRSSelection();
    // this.httpServiceService.currentLangugae$.subscribe(response =>this.currentLanguageSet = response);
    console.log("visit",this.visitCategory);
    
  }
  // enableHistoryOnIDRSSelection() {
  //   this.enablingHistorySectionSubscription = this.ncdScreeningService.enableHistoryFormafterFormInit$.subscribe(
  //     (response) => {
  //       if(response === true) {
  //         this.historyFormDeclared = true;
  //         } else {
  //           this.historyFormDeclared = true;
  //         }
  //     });
    
  // }

  ngOnChanges(changes) {
    if (changes.mode && this.mode == 'update') {
      let visitCategory = localStorage.getItem('visitCategory');
      if(visitCategory == "NCD screening"){
        this.updatePatientNCDScreeningHistory(this.patientHistoryForm);
      }else{
        this.updatePatientGeneralHistory(this.patientHistoryForm);
      }
    }

    if (changes.pregnancyStatus) {
      this.canShowObstetricHistory();
    }

    if (changes.primiGravida) {
      this.canShowObstetricHistory();
    }
   this.enableIdrsHistoryForm();
  }
 
  // this method is used to show family history and personal history for IDRS and to show personal history for both IDRS and CBAC
  enableIdrsHistoryForm(){
    if(this.visitCategory == "NCD screening"){
      this.enablingHistorySectionSubscription =  this.ncdScreeningService.enablingIdrs$.subscribe((response) => {
        if (response === true) {
          this.showHistory = true;
        } else {
          this.showHistory = false;  
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.beneficiaryDetailsSubscription)
      this.beneficiaryDetailsSubscription.unsubscribe();
      if (this.enablingHistorySectionSubscription)
      this.enablingHistorySectionSubscription.unsubscribe();
  }

  updatePatientGeneralHistory(generalOPDHistory) {
    let vanID = JSON.parse(localStorage.getItem('serviceLineDetails')).vanID;
    let parkingPlaceID = JSON.parse(localStorage.getItem('serviceLineDetails')).parkingPlaceID
    let temp = {
      beneficiaryRegID: localStorage.getItem('beneficiaryRegID'),
      benVisitID: localStorage.getItem('visitID'),
      providerServiceMapID: localStorage.getItem('providerServiceID'),
      createdBy: localStorage.getItem('userName'),
      modifiedBy: localStorage.getItem('userName'),
      beneficiaryID: localStorage.getItem('beneficiaryID'), sessionID: localStorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID, vanID: vanID,
      benFlowID: localStorage.getItem('benFlowID'),
      visitCode: localStorage.getItem('visitCode')
    }

    this.doctorService.updateGeneralHistory(generalOPDHistory, temp, this.beneficiary.ageVal)
      .subscribe((res: any) => {
        if (res.statusCode == 200 && res.data != null) {
          if(localStorage.getItem('visitCategory') == 'ANC')
          {
            this.getHRPDetails();
          }
          this.confirmationService.alert(res.data.response, 'success');
          this.patientHistoryForm.markAsPristine();
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      }, err => {
        this.confirmationService.alert(err, 'error');
      })
  }


  getHRPDetails()
  {
    let beneficiaryRegID = localStorage.getItem("beneficiaryRegID");
    let visitCode = localStorage.getItem('visitCode');
  this.doctorService
    .getHRPDetails(beneficiaryRegID,visitCode)
    .subscribe(res => {
      if (res && res.statusCode == 200 && res.data) {
        if(res.data.isHRP == true)
        {
          this.beneficiaryDetailsService.setHRPPositive();
        }
        else
        {
          this.beneficiaryDetailsService.resetHRPPositive();
        }
      }
    });
  }

  beneficiaryDetailsSubscription: any;
  getBeneficiaryDetails() {
    this.beneficiaryDetailsSubscription = this.beneficiaryDetailsService.beneficiaryDetails$.subscribe(beneficiary => {
      if (beneficiary) {
        this.beneficiary = beneficiary;
       

        let calculateAgeInYears = beneficiary.age.split('-')[0].trim();
        let calculateAgeInMonths = beneficiary.age.split('-')[1] ? beneficiary.age.split('-')[1].trim() : "";
        let age = this.getAgeValueNew(calculateAgeInYears);
        if (age !== 0 && calculateAgeInMonths !== "0 months") {

          this.beneficiaryAge = age + 1; 
        }
        else
        {
             this.beneficiaryAge = age;
        }

      //  this.ageCalculator(this.beneficiary.dob);
		
        this.canShowObstetricHistory();
      }
    })
  }

  getAgeValueNew(age) {
    if (!age) return 0;
    let arr = (age !== undefined && age !== null) ? age.trim().split(' ') : age;
    if (arr[1]) {
      let ageUnit = arr[1];
      if (ageUnit.toLowerCase() == "years") {
        return parseInt(arr[0]);
      }
    }
    return 0;
  }		

  ageCalculator(dob){
    if(dob){
      const convertAge = new Date(dob);
      const timeDiff = Math.abs(Date.now() - convertAge.getTime());
      this.beneficiaryAge = Math.floor((timeDiff / (1000 * 3600 * 24))/365);
    }
  }

 
  canShowObstetricHistory() {
    if (this.primiGravida)
      this.showObstetricHistory = false;
    else if(this.visitCategory == 'NCD care')
      this.showObstetricHistory = false;
    else if (this.beneficiary && this.beneficiary.genderName == "Male")
      this.showObstetricHistory = false;
    else if (this.beneficiary && this.beneficiary.genderName != "Male" && this.beneficiary.ageVal < 12)
      this.showObstetricHistory = false;
    else if (this.beneficiary && this.beneficiary.genderName != "Male" && this.beneficiary.ageVal >= 12)
      this.showObstetricHistory = true;
    else if (this.visitCategory == 'PNC')
      this.showObstetricHistory = true;
    else if (!this.primiGravida)
      this.showObstetricHistory = true;
  }
  updatePatientNCDScreeningHistory(NCDScreeningHistory) {
    let vanID = JSON.parse(localStorage.getItem('serviceLineDetails')).vanID;
    let parkingPlaceID = JSON.parse(localStorage.getItem('serviceLineDetails')).parkingPlaceID
    let temp = {
      beneficiaryRegID: localStorage.getItem('beneficiaryRegID'),
      benVisitID: localStorage.getItem('visitID'),
      providerServiceMapID: localStorage.getItem('providerServiceID'),
      createdBy: localStorage.getItem('userName'),
      modifiedBy: localStorage.getItem('userName'),
      beneficiaryID: localStorage.getItem('beneficiaryID'), sessionID: localStorage.getItem('sessionID'),
      parkingPlaceID: parkingPlaceID, vanID: vanID,
      benFlowID: localStorage.getItem('benFlowID'),
      visitCode: localStorage.getItem('visitCode')
    }

    this.doctorService.updateNCDScreeningHistory(NCDScreeningHistory, temp, this.beneficiary.ageVal)
      .subscribe((res: any) => {
        if (res.statusCode == 200 && res.data != null) {
          this.confirmationService.alert(res.data.response, 'success');
          this.patientHistoryForm.markAsPristine();
        } else {
          this.confirmationService.alert(res.errorMessage, 'error');
        }
      }, err => {
        this.confirmationService.alert(err, 'error');
      })
  }
  ngDoCheck() {
    this.assignSelectedLanguage();
  }

  assignSelectedLanguage() {
		const getLanguageJson = new SetLanguageComponent(this.httpServiceService);
		getLanguageJson.setLanguage();
		this.currentLanguageSet = getLanguageJson.currentLanguageObject;
	  }
}
