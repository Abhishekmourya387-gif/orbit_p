package com.starrypath.app.vpn;

import java.util.Arrays;
import java.util.List;

/**
 * Configurable DNS resolver endpoints for content filtering.
 * Default resolver is CleanBrowsing Family Filter which blocks adult content,
 * malicious domains, phishing, and enforces SafeSearch across search engines.
 */
public class DnsEndpoints {

    public static class DnsProvider {
        private final String id;
        private final String name;
        private final String description;
        private final List<String> ipv4Servers;
        private final List<String> ipv6Servers;

        public DnsProvider(String id, String name, String description, List<String> ipv4Servers, List<String> ipv6Servers) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.ipv4Servers = ipv4Servers;
            this.ipv6Servers = ipv6Servers;
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getDescription() { return description; }
        public List<String> getIpv4Servers() { return ipv4Servers; }
        public List<String> getIpv6Servers() { return ipv6Servers; }
    }

    // CleanBrowsing Family Filter (Default)
    // Primary: 185.228.168.168, Secondary: 185.228.169.168
    public static final DnsProvider CLEANBROWSING_FAMILY = new DnsProvider(
            "cleanbrowsing_family",
            "CleanBrowsing Family Filter",
            "Blocks adult content, pornography, malicious sites, and enforces SafeSearch.",
            Arrays.asList("185.228.168.168", "185.228.169.168"),
            Arrays.asList("2a0d:5600:33:4::1", "2a0d:5600:33:4::2")
    );

    // CleanBrowsing Adult Filter
    public static final DnsProvider CLEANBROWSING_ADULT = new DnsProvider(
            "cleanbrowsing_adult",
            "CleanBrowsing Adult Filter",
            "Blocks adult content and explicit domains while keeping search open.",
            Arrays.asList("185.228.168.10", "185.228.169.11"),
            Arrays.asList("2a0d:5600:33:4::", "2a0d:5600:33:4::1")
    );

    // Cloudflare 1.1.1.3 Family Filter (Malware + Adult content blocking)
    public static final DnsProvider CLOUDFLARE_FAMILY = new DnsProvider(
            "cloudflare_family",
            "Cloudflare 1.1.1.3 Family",
            "Cloudflare public resolver with automated malware and adult content blocking.",
            Arrays.asList("1.1.1.3", "1.0.0.3"),
            Arrays.asList("2606:4700:4700::1113", "2606:4700:4700::1003")
    );

    public static final DnsProvider DEFAULT = CLEANBROWSING_FAMILY;
}
