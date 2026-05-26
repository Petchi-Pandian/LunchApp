import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';

import LunchApp from './components/LunchApp';
import { ILunchAppProps } from './components/ILunchAppProps';

export interface ILunchAppWebPartProps {
  description: string;
}

export default class LunchAppWebPart extends BaseClientSideWebPart<ILunchAppWebPartProps> {

  public render(): void {
    const element: React.ReactElement<ILunchAppProps> = React.createElement(LunchApp, {
      context: this.context,
      userDisplayName: this.context.pageContext.user.displayName,
    });
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: { description: 'Lunch App Settings' },
          groups: [
            {
              groupName: 'General',
              groupFields: [
                PropertyPaneTextField('description', {
                  label: 'Description',
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
