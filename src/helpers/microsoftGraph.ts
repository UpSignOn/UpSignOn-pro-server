import { ClientSecretCredential } from '@azure/identity';
import { Client, ClientOptions } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { db } from './db';
import { logError } from './logger';

// Necessary permissions are listed here
// Création de l'application: App Registrations > New
//   - choisir le scope qui correspond aux personnes qui auront le droit d'utiliser upsignon
//   - pas de redirect URL
// API Permissions > Microsoft Graph > Application Permission
// - Directory.Read.All
// OR
// - User.ReadBasic.All
// - GroupMember.Read.All
// -
// Puis Grant Admin consent for Default Directory
// Then create an appRole that allows users to have a PRO vault:
//   - Description : Can create an UpSignOn PRO vault

// GRAPH EXPLORER
// https://developer.microsoft.com/en-us/graph/graph-explorer

// SYNTAX DOC: https://learn.microsoft.com/en-us/graph/filter-query-parameter?tabs=http
// THROTTLING LIMITS: https://learn.microsoft.com/en-us/graph/throttling-limits

// NB Active Directory package: https://www.npmjs.com/package/activedirectory2

type EntraConfig = {
  tenantId: string | null;
  clientId: string | null;
  clientSecret: string | null;
  appResourceId: string | null;
};
type EntraGroup = {
  id: string;
  displayName: string;
};
export class MicrosoftGraph {
  static _instances: { [groupId: number]: _MicrosoftGraph } = {};
  static _groupConfig: { [groupId: number]: EntraConfig | null } = {};

  // NB: do not try catch requests to Microsoft Graph to avoid deactivating users due to throttling limit

  static async getUserId(groupId: number, userEmail: string): Promise<string | null> {
    const graph = await MicrosoftGraph._getInstance(groupId, true);
    if (graph) {
      const userId = await graph._getUserIdFromEmail(userEmail);
      return userId;
    }
    return null;
  }
  static async isUserAuthorizedForUpSignOn(groupId: number, uid: string): Promise<boolean> {
    const graph = await MicrosoftGraph._getInstance(groupId, false);
    if (graph) {
      const isAuthorized = await graph.isUserAuthorizedForUpSignOn(uid);
      return isAuthorized;
    }
    return false;
  }
  static async getAllUsersAssignedToUpSignOn(
    groupId: number,
    withoutConfigRefresh: boolean,
  ): Promise<string[]> {
    const graph = await MicrosoftGraph._getInstance(groupId, withoutConfigRefresh);
    if (graph) {
      const allUsers = await graph.getAllUsersAssignedToUpSignOn();
      return allUsers;
    }
    return [];
  }

  static async getGroupsForUser(groupId: number, uid: string): Promise<EntraGroup[]> {
    try {
      const graph = await MicrosoftGraph._getInstance(groupId, false);
      if (graph) {
        const groups = await graph.getGroupsForUser(uid);
        return groups;
      }
    } catch (e) {
      logError(e);
    }
    return [];
  }

  static async _getInstance(
    groupId: number,
    withoutConfigRefresh: boolean,
  ): Promise<_MicrosoftGraph | null> {
    if (!withoutConfigRefresh && MicrosoftGraph._instances[groupId]) {
      return MicrosoftGraph._instances[groupId];
    }
    const entraConfigRes = await db.query('SELECT ms_entra_config FROM groups WHERE id=$1', [
      groupId,
    ]);
    const entraConfig: EntraConfig | null = entraConfigRes.rows[0]?.ms_entra_config || null;
    if (
      !MicrosoftGraph._instances[groupId] ||
      MicrosoftGraph._hasConfigChanged(groupId, entraConfig)
    ) {
      if (
        entraConfig?.tenantId &&
        entraConfig.clientId &&
        entraConfig.clientSecret &&
        entraConfig.appResourceId
      ) {
        MicrosoftGraph._instances[groupId] = new _MicrosoftGraph(
          entraConfig.tenantId,
          entraConfig.clientId,
          entraConfig.clientSecret,
          entraConfig.appResourceId,
        );
      } else {
        delete MicrosoftGraph._instances[groupId];
      }
      MicrosoftGraph._groupConfig[groupId] = entraConfig;
    }
    return MicrosoftGraph._instances[groupId] || null;
  }

  static _hasConfigChanged(groupId: number, currentConfig: EntraConfig | null): boolean {
    const cachedConfig = MicrosoftGraph._groupConfig[groupId];
    if (currentConfig == null && cachedConfig == null) return false;
    if (
      currentConfig?.tenantId != cachedConfig?.tenantId ||
      currentConfig?.clientId != cachedConfig?.clientId ||
      currentConfig?.clientSecret != cachedConfig?.clientSecret ||
      currentConfig?.appResourceId != cachedConfig?.appResourceId
    ) {
      return true;
    }
    return false;
  }
}

class _MicrosoftGraph {
  msGraph: Client;
  appResourceId: string;

  /**
   *
   * @param tenantId - The Microsoft Entra tenant (directory) ID.
   * @param clientId - The client (application) ID of an App Registration in the tenant.
   * @param clientSecret - A client secret that was generated for the App Registration.
   * @param appResourceId - Identifier of the ressource (UpSignOn) in the graph that users need to have access to in order to be authorized to use an UpSignOn licence
   */
  constructor(tenantId: string, clientId: string, clientSecret: string, appResourceId: string) {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      // The client credentials flow requires that you request the
      // /.default scope, and pre-configure your permissions on the
      // app registration in Azure. An administrator must grant consent
      // to those permissions beforehand.
      scopes: ['https://graph.microsoft.com/.default'],
    });

    const clientOptions: ClientOptions = {
      authProvider,
    };
    this.msGraph = Client.initWithMiddleware(clientOptions);
    this.appResourceId = appResourceId;
  }

  /**
   * Gets the id of the first user to match that email address and who has been assigned the role for using UpSignOn
   *
   * @param email
   * @returns the id if such a user exists, null otherwise
   */
  async _getUserIdFromEmail(email: string): Promise<string | null> {
    if (!email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      throw 'Email is malformed';
    }

    // PERMISSION = User.ReadBasic.All
    const users = await this.msGraph
      .api('/users')
      .header('ConsistencyLevel', 'eventual')
      .filter(`mail eq '${email}' or otherMails/any(oe:oe eq '${email}')`)
      .select(['id'])
      .get();
    const userId = users.value[0]?.id;
    return userId;
  }

  async isUserAuthorizedForUpSignOn(uid: string): Promise<boolean> {
    // PERMISSION = AppRoleAssignment.ReadWrite.All ou Directory.Read.All
    // may actually need Directory.Read.All since we act as an app (https://learn.microsoft.com/en-us/graph/api/user-list-approleassignments?view=graph-rest-1.0&tabs=http)
    const appRoleAssignments = await this.msGraph
      .api(`/users/${uid}/appRoleAssignments`)
      .header('ConsistencyLevel', 'eventual')
      .filter(`resourceId eq ${this.appResourceId}`)
      .get();
    return appRoleAssignments.value.length > 0;
  }

  async getAllUsersAssignedToUpSignOn(): Promise<string[]> {
    // PERMISSION: Application.Read.All
    // PERMISSION: Directory.Read.All
    const allPrincipalsRes = await this.msGraph
      .api(`/servicePrincipals/${this.appResourceId}/appRoleAssignedTo`)
      .header('ConsistencyLevel', 'eventual')
      .select(['principalType', 'principalId'])
      .get();
    const allUsersId: string[] = allPrincipalsRes.value
      .filter((u: any) => u.principalType === 'User')
      .map((u: any) => u.principalId);
    const allGroups = allPrincipalsRes.value.filter((u: any) => u.principalType === 'Group');
    for (let i = 0; i < allGroups.length; i++) {
      const g = allGroups[i];
      const allGroupUsersRes = await this.msGraph
        .api(`/groups/${g.id}/members/microsoft.graph.user`)
        .header('ConsistencyLevel', 'eventual')
        .select(['id'])
        .get();
      allUsersId.push(allGroupUsersRes.value.map((u: any) => u.id));
    }
    return allUsersId;
  }

  /**
   * Returns all groups (and associated groups) that this user belongs to
   * To be used for sharing to teams ?
   * This would suppose a user can only shared to teams to which it belongs ?
   * @param email
   * @returns
   */
  async getGroupsForUser(uid: string): Promise<{ id: string; displayName: string }[]> {
    // https://learn.microsoft.com/en-us/graph/api/associatedteaminfo-list?view=graph-rest-1.0&tabs=http
    // PERMISSION = User.Read.All
    const groups = await this.msGraph
      // .api(`/users/${userId}/memberOf`) // pour tout avoir
      // .api(`/users/${userId}/memberOf/microsoft.graph.administrativeUnit`) // pour avoir tous les administrativeUnit
      .api(`/users/${uid}/memberOf/microsoft.graph.group`) // pour avoir tous les groupes
      .header('ConsistencyLevel', 'eventual')
      .select(['id', 'displayName'])
      .get();

    return groups.value;
  }

  /**
   * Returns all members of a group
   * @returns
   */
  async listGroupMembers(groupId: string): Promise<{ id: string; displayName: string }[]> {
    // PERMISSION = GroupMember.Read.All
    const groupMembers = await this.msGraph
      .api(`/groups/${groupId}/members/microsoft.graph.user/`) // https://learn.microsoft.com/en-us/graph/api/group-list-members?view=graph-rest-1.0&tabs=http
      .header('ConsistencyLevel', 'eventual')
      .select(['id', 'mail', 'displayName'])
      .get();

    return groupMembers.value;
  }

  async checkGroupMembers(groupIds: string[]) {
    // PERMISSION = GroupMember.Read.All
    const allGroups = await this.msGraph
      .api(`/groups`)
      .header('ConsistencyLevel', 'eventual')
      .filter(`id in ('${groupIds.join("', '")}')`)
      .expand('members($select=id, displayName, mail')
      .select(['id'])
      .get();
    // When sharing to a group, there should be a check that verifies nex users in that group and removed users from that group to adapt sharing
  }

  // /**
  //  * Returns all members of an administrative unit
  //  * @returns
  //  */
  // async listAdministrativeUnitMembers(
  //   groupId: string,
  // ): Promise<{ id: string; displayName: string }[]> {
  //   // AdministrativeUnit.Read.All
  //   const groupMembers = await this.msGraph
  //     .api(`/administrativeUnits/${groupId}/members/microsoft.graph.user/`) // https://learn.microsoft.com/en-us/graph/api/group-list-members?view=graph-rest-1.0&tabs=http
  //     .header('ConsistencyLevel', 'eventual')
  //     .filter('')
  //     .select(['id', 'mail', 'displayName'])
  //     .get();

  //   console.log(groupMembers);
  //   return groupMembers.value;
  // }

  // async isDeviceAuthorizedForUser(email: string, deviceId: string): Promise<boolean> {
  //   const userId = await this._getUserIdFromEmail(email);
  //   if (!userId) return false;
  //   // TODO make sure deviceId has been validated
  //   const userDevices = await this.msGraph
  //     .api(`/deviceManagement/managedDevices`) // https://learn.microsoft.com/en-us/graph/api/intune-devices-manageddevice-get?view=graph-rest-1.0&tabs=http
  //     .header('ConsistencyLevel', 'eventual')
  //     .filter(`userId eq '${userId}'`)
  //     .select([
  //       'id',
  //       'userId',
  //       'osVersion',
  //       'model',
  //       'jailBroken',
  //       'easDeviceId',
  //       'emailAddress',
  //       'deviceName',
  //       'imei',
  //       'serialNumber',
  //     ])
  //     .get();

  //   console.log(userDevices);
  //   return userDevices.value;
  // }
}
