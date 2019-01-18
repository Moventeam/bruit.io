import {
  BrtCookies,
  BrtData,
  BrtFeedback,
  BrtField,
  BrtLog,
  BrtNavigatorInfo,
  BrtScreenInfo,
  BrtServiceWorker
} from '@bruit/types';
import { BrtFieldType } from '@bruit/types/dist/enums/brt-field-type';
import { NavigatorTool } from '../bruit-tools/navigator';
import { ScreenTool } from '../bruit-tools/screen';
import { Api } from './api';

export class Feedback implements BrtFeedback {
  //FeedbackModel:
  date: string;
  apiKey: string;
  canvas: string;
  url: string;
  cookies: BrtCookies;
  navigator: BrtNavigatorInfo;
  display: BrtScreenInfo;
  logs: Array<BrtLog>;
  data: Array<BrtData>;
  serviceWorkers: Array<BrtServiceWorker>;

  getScreenShoot: Promise<void>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.url = NavigatorTool.getUrl();
    this.cookies = NavigatorTool.getCookies();

    this.display = ScreenTool.getInfo();
    if ((<any>console).overloadable && (<any>console).overloaded && (<any>console).overloaded.logArray) {
      this.logs = (<any>console).logArray();
    } else {
      this.logs = [];
    }
  }

  public async init(startScreenShot: boolean = false): Promise<void> {
    try {
      if (startScreenShot) {
        this.startScreenShot();
      }
      const [navigator, serviceWorkers] = await Promise.all([
        NavigatorTool.getInfo(),
        NavigatorTool.getServiceWorkersList()
      ]);

      this.navigator = navigator;
      this.serviceWorkers = serviceWorkers;
    } catch (e) {
      throw e;
    }
  }

  public startScreenShot() {
    this.getScreenShoot = ScreenTool.getScreenshot()
      .then(screenshot => {
        this.canvas = screenshot;
      })
      .catch(() => {
        // TODO : emettre une erreur
        return Promise.resolve();
      });
  }
  /**
   *
   * @param formFields
   * @param data
   * @param dataFn
   */
  public async send(
    formFields: Array<BrtField>,
    data: Array<BrtData> = [],
    dataFn?: () => Array<BrtData> | Promise<Array<BrtData>>
  ): Promise<any> {
    try {
      const agreementField = formFields.find(field => field.id === 'agreement');
      const agreement = agreementField ? agreementField.value : true;
      const dataFromFn: Array<BrtData> = await this.getDataFromFn(dataFn);
      const formData = formFields.map(field => this.fieldToData(field));

      this.data = [...formData, ...data, ...dataFromFn];

      await this.getScreenShoot;

      return Api.postFeedback({
        date: new Date().toString(),
        apiKey: this.apiKey,
        canvas: agreement ? this.canvas : undefined,
        url: agreement ? this.url : undefined,
        cookies: agreement ? this.cookies : undefined,
        navigator: agreement ? this.navigator : undefined,
        display: agreement ? this.display : undefined,
        logs: agreement ? this.logs : undefined,
        serviceWorkers: agreement ? this.serviceWorkers : undefined,
        data: this.data
      });
    } catch (e) {
      throw e;
    }
  }

  /**
   *
   * @param dataFn a function that return an Array<Field> or an Promise<Array<Field>>
   *
   * @return a promise of Array<Field>
   */
  private async getDataFromFn(dataFn?: () => Array<BrtData> | Promise<Array<BrtData>>): Promise<Array<BrtData>> {
    // dataFn (function or promise)
    if (dataFn) {
      if (typeof dataFn === 'function') {
        return dataFn();
      } else if (typeof dataFn === 'object' && (<Promise<Array<BrtData>>>dataFn).then) {
        return <Promise<Array<BrtData>>>dataFn;
      }
    } else {
      return [];
    }
  }

  /**
   *
   * @param field : BrtField from form
   *
   * @return a BrtData
   */
  private fieldToData(field: BrtField): BrtData {
    const data = <BrtData>{
      type: field.type,
      value: field.value,
      label: field.label,
      id: field.id
    };
    if (data.type === BrtFieldType.RATING) {
      data.max = field.max || 5;
    }
    return data;
  }
}
