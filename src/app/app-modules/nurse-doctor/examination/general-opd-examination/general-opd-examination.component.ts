import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { HttpServiceService } from 'app/app-modules/core/services/http-service.service';
import { DoctorService, NurseService } from '../../shared/services';
import { SetLanguageComponent } from 'app/app-modules/core/components/set-language.component';

@Component({
  selector: 'nurse-general-opd-examination',
  templateUrl: './general-opd-examination.component.html',
  styleUrls: ['./general-opd-examination.component.css']
})
export class GeneralOpdExaminationComponent implements OnInit {

  @Input('visitCategory')
  visitCategory: string;

  @Input('patientExaminationForm')
  patientExaminationForm: FormGroup;

  @Input('mode')
  mode: String;
  current_language_set: any;

  constructor(
    private doctorService: DoctorService,
    private confirmationService: ConfirmationService,
    public httpServiceService: HttpServiceService,
    private nurseService: NurseService
  ) { }

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

  ngOnDestroy() {
    if (this.ancExaminationDataSubscription)
      this.ancExaminationDataSubscription.unsubscribe();
  }

  ngOnChanges() {
    if (this.mode == 'view') {
      let visitID = localStorage.getItem('visitID');
      let benRegID = localStorage.getItem('beneficiaryRegID')
      this.getAncExaminationData(benRegID, visitID);
    }
    if(parseInt(localStorage.getItem("specialistFlag")) == 100)
    {
       let visitID = localStorage.getItem('visitID');
      let benRegID = localStorage.getItem('beneficiaryRegID')
      this.getAncExaminationData(benRegID, visitID);
    }
    if (this.mode == 'update') {
      this.updatePatientExamination(this.patientExaminationForm);
    }
  }

  checkRequired(patientExaminationForm) {
    const required = [];
    const generalExaminationForm = <FormGroup>patientExaminationForm.controls['generalExaminationForm'];
    if (generalExaminationForm.controls['typeOfDangerSigns'].errors) {
      required.push(this.current_language_set.ExaminationData.ANC_OPD_PNCExamination.genExamination.dangersigns);
    }
    if (generalExaminationForm.controls['lymphnodesInvolved'].errors) {
      required.push(this.current_language_set.ExaminationData.ANC_OPD_PNCExamination.genExamination.lymph);
    }
    if (generalExaminationForm.controls['typeOfLymphadenopathy'].errors) {
      required.push(this.current_language_set.ExaminationData.ANC_OPD_PNCExamination.genExamination.typeofLymphadenopathy);
    }
    if (generalExaminationForm.controls['extentOfEdema'].errors) {
      required.push(this.current_language_set.ExaminationData.ANC_OPD_PNCExamination.genExamination.extentofEdema);
    }
    if (generalExaminationForm.controls['edemaType'].errors) {
      required.push(this.current_language_set.ExaminationData.ANC_OPD_PNCExamination.genExamination.typeofEdema);

    }
    if (required.length) {
      this.confirmationService.notify(this.current_language_set.alerts.info.mandatoryFields, required);
      return false;
    } else {
      return true;
    }
  }
  updatePatientExamination(patientExaminationForm) {
    if (this.checkRequired(patientExaminationForm)) {
      let vanID = JSON.parse(localStorage.getItem('serviceLineDetails')).vanID;
      let parkingPlaceID = JSON.parse(localStorage.getItem('serviceLineDetails')).parkingPlaceID
      let updateDetails = {
        beneficiaryRegID: localStorage.getItem('beneficiaryRegID'),
        benVisitID: localStorage.getItem('visitID'),
        providerServiceMapID: localStorage.getItem('providerServiceID'),
        modifiedBy: localStorage.getItem('userName'),
        beneficiaryID: localStorage.getItem('beneficiaryID'), sessionID: localStorage.getItem('sessionID'),
        parkingPlaceID: parkingPlaceID, vanID: vanID,
        benFlowID: localStorage.getItem('benFlowID'),
        visitCode: localStorage.getItem('visitCode')
      }

      this.doctorService.updatePatientExamination(patientExaminationForm.value, this.visitCategory, updateDetails)
        .subscribe((res: any) => {
          if (res.statusCode == 200 && res.data != null) {
            this.confirmationService.alert(this.current_language_set.alerts.info.examUpdated, 'success');
            this.patientExaminationForm.markAsPristine();
            this.nurseService.setUpdateForHrpStatus(false);
          } else {
            this.confirmationService.alert(this.current_language_set.alerts.info.errorInExamUpdated, 'error');
          }
        }, err => {
          this.confirmationService.alert(this.current_language_set.alerts.info.errorInExamUpdated, 'error');
        })
    }
  }

  ancExaminationDataSubscription: any;
  getAncExaminationData(benRegID, visitID) {
    this.ancExaminationDataSubscription = this.doctorService.getGeneralExamintionData(benRegID, visitID)
      .subscribe(examinationData => {
        if (examinationData.statusCode == 200 && examinationData.data) {
          console.log('examinationData.data', JSON.stringify(examinationData.data, null, 4))
          let temp = examinationData.data;

          if (this.visitCategory == 'ANC') {
            this.checkObstetricExamination(temp);
            let ancFormData = Object.assign({
              'generalExaminationForm': temp.generalExamination,
              'headToToeExaminationForm': temp.headToToeExamination,
              'systemicExaminationForm': Object.assign({
                'cardioVascularSystemForm': temp.cardiovascularExamination,
                'respiratorySystemForm': temp.respiratoryExamination,
                'centralNervousSystemForm': temp.centralNervousExamination,
                'musculoSkeletalSystemForm': temp.musculoskeletalExamination,
                'genitoUrinarySystemForm': temp.genitourinaryExamination,
                'obstetricExaminationForANCForm': temp.obstetricExamination
              })
            });
            this.patientExaminationForm.patchValue(ancFormData);

            if(temp.obstetricExamination.isHRP !== undefined && temp.obstetricExamination.isHRP !== null && 
              temp.obstetricExamination.reasonsForHRP !== undefined && temp.obstetricExamination.reasonsForHRP !== null) {
            this.doctorService.isHrpFromNurse = temp.obstetricExamination.isHRP;
            this.doctorService.reasonHrpFromNurse = temp.obstetricExamination.reasonsForHRP;

            this.doctorService.enableHrpReasonsStatus(true);
              }
      
          }

          if (this.visitCategory == 'PNC') {
            let ancFormData = Object.assign({
              'generalExaminationForm': temp.generalExamination,
              'headToToeExaminationForm': temp.headToToeExamination,
              'systemicExaminationForm': Object.assign({
                'gastroIntestinalSystemForm': temp.gastrointestinalExamination,
                'cardioVascularSystemForm': temp.cardiovascularExamination,
                'respiratorySystemForm': temp.respiratoryExamination,
                'centralNervousSystemForm': temp.centralNervousExamination,
                'musculoSkeletalSystemForm': temp.musculoskeletalExamination,
                'genitoUrinarySystemForm': temp.genitourinaryExamination,
              })
            });
            this.patientExaminationForm.patchValue(ancFormData);
          }

          if (this.visitCategory == 'General OPD') {
            // this.patchOralExamination(temp);
            let ancFormData = Object.assign({
              'generalExaminationForm': temp.generalExamination,
              'headToToeExaminationForm': temp.headToToeExamination,
              // 'oralExaminationForm': temp.oralDetails,
              'systemicExaminationForm': Object.assign({
                'gastroIntestinalSystemForm': temp.gastrointestinalExamination,
                'cardioVascularSystemForm': temp.cardiovascularExamination,
                'respiratorySystemForm': temp.respiratoryExamination,
                'centralNervousSystemForm': temp.centralNervousExamination,
                'musculoSkeletalSystemForm': temp.musculoskeletalExamination,
                'genitoUrinarySystemForm': temp.genitourinaryExamination,
                'obstetricExaminationForANCForm': temp.obstetricExamination
              })
            });
            this.patientExaminationForm.patchValue(ancFormData);
          }
        }
      })
  }

  checkObstetricExamination(temp) {
    if(temp.obstetricExamination !== undefined && temp.obstetricExamination !== null)
    { 
      if(temp.obstetricExamination.malPresentation !== undefined && temp.obstetricExamination.malPresentation !== null)
      {
            temp.obstetricExamination.malPresentation = temp.obstetricExamination.malPresentation.toString();
      }

      if(temp.obstetricExamination.lowLyingPlacenta !== undefined && temp.obstetricExamination.lowLyingPlacenta !== null)
      {
            temp.obstetricExamination.lowLyingPlacenta = temp.obstetricExamination.lowLyingPlacenta.toString();
      }


      if(temp.obstetricExamination.vertebralDeformity !== undefined && temp.obstetricExamination.vertebralDeformity !== null)
      {
            temp.obstetricExamination.vertebralDeformity = temp.obstetricExamination.vertebralDeformity.toString();
      }
    }
  

}

  patchOralExamination(examinationDetails) {
    if (examinationDetails.oralDetails !== undefined && examinationDetails.oralDetails !== null) {
      let arr = ["Leukoplakia", "Sub muscus fibrosis", "Melanoplakia", "Erythroplakia", "Non healing mouth ulcer(>2 weeks)", "Any other lesion"];

      // let temp = examinationDetails.oralDetails.preMalignantLesionType.split(',');
      // temp.pop();
      let temp = examinationDetails.oralDetails.preMalignantLesionTypeList;


if(temp !== undefined && temp !== null) {
      let other = temp.filter((item) => {
        return arr.indexOf(item) == -1;
      });

      if (other.length > 0) {
        examinationDetails.oralDetails.otherLesionType = other[0];
        temp.push("Any other lesion");
      }
    }

      


    
      examinationDetails.oralDetails.preMalignantLesionTypeList = temp;

      let oralExaminationFormDetails = Object.assign({}, examinationDetails.oralDetails);

      this.patientExaminationForm.controls['oralExaminationForm'].patchValue(oralExaminationFormDetails);
    }
  }
}