using VNC.LocalAgent.Core.Security;
using Xunit;

namespace VNC.LocalAgent.Tests;

public class RedactionTests
{
    [Fact]
    public void Redact_StripsWlanXmlKeyMaterial()
    {
        string xml = "<WLANProfile><MSM><security><sharedKey><keyMaterial>SuperSecretPsk999</keyMaterial></sharedKey></security></MSM></WLANProfile>";
        string result = RedactionEngine.Redact(xml);

        Assert.DoesNotContain("SuperSecretPsk999", result);
        Assert.Contains("<keyMaterial>[REDACTED_PSK]</keyMaterial>", result);
    }

    [Fact]
    public void Redact_StripsBearerAndKeyValues()
    {
        string log = "Connecting with password=\"MyRouterAdminPass\" token=xyz123 and Bearer abc.def.ghi";
        string result = RedactionEngine.Redact(log);

        Assert.DoesNotContain("MyRouterAdminPass", result);
        Assert.DoesNotContain("xyz123", result);
        Assert.DoesNotContain("abc.def.ghi", result);
        Assert.Contains("password=[REDACTED]", result);
        Assert.Contains("Bearer [REDACTED_TOKEN]", result);
    }
}
